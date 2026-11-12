import base64
import contextvars
import json
import re
import time
from typing import AsyncIterator, Dict, Optional, Type, TypeVar
import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, ValidationError
from app.core.config import settings

T = TypeVar("T", bound=BaseModel)

_llm_telemetry_ctx: contextvars.ContextVar[Optional[Dict[str, str]]] = contextvars.ContextVar(
    "llm_telemetry_ctx", default=None
)


def reset_llm_telemetry() -> contextvars.Token:
    return _llm_telemetry_ctx.set(None)


def get_llm_telemetry() -> Optional[Dict[str, str]]:
    return _llm_telemetry_ctx.get()


def _record_telemetry(provider: str, model: str, latency_ms: int, fallback_used: bool) -> None:
    _llm_telemetry_ctx.set(
        {
            "provider": provider,
            "model": model,
            "latency_ms": str(max(0, latency_ms)),
            "fallback_used": "true" if fallback_used else "false",
        }
    )


class LLMProviderUnavailableError(HTTPException):
    def __init__(self, detail: str) -> None:
        super().__init__(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=detail)


class ModularLLMClient:
    """
    Modular LLM interface isolating Gemini and OpenAI behind strict Pydantic output validation.
    Never invents dummy static outputs if credentials are absent or remote providers fail.
    """

    def _strip_json_fences(self, raw_text: str) -> str:
        cleaned = raw_text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        return cleaned.strip()

    async def generate_structured(
        self, system_prompt: str, user_prompt: str, schema_cls: Type[T]
    ) -> T:
        provider = settings.LLM_PROVIDER.lower().strip()

        if provider == "openai":
            raw_json = await self._call_openai(system_prompt, user_prompt, schema_cls)
        elif provider == "gemini":
            raw_json = await self._call_gemini(system_prompt, user_prompt, schema_cls)
        else:
            raise LLMProviderUnavailableError(
                f"Unsupported LLM_PROVIDER '{settings.LLM_PROVIDER}'. Set LLM_PROVIDER to 'gemini' or 'openai' in ai-service/.env."
            )

        cleaned = self._strip_json_fences(raw_json)
        try:
            return schema_cls.model_validate_json(cleaned)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"AI model returned output violating structured schema: {exc.error_count()} validation issue(s).",
            ) from exc

    async def _call_gemini(
        self, system_prompt: str, user_prompt: str, schema_cls: Type[BaseModel]
    ) -> str:
        if not settings.GEMINI_API_KEY:
            raise LLMProviderUnavailableError(
                "GEMINI_API_KEY is not configured in ai-service/.env. Add your Gemini API key or switch LLM_PROVIDER=openai."
            )

        schema_json = json.dumps(schema_cls.model_json_schema(), indent=2)
        combined_prompt = (
            f"{system_prompt}\n\n"
            f"Return ONLY valid JSON conforming strictly to this JSON Schema:\n{schema_json}\n\n"
            f"{user_prompt}"
        )

        candidate_models = [settings.GEMINI_MODEL] + [
            m.strip()
            for m in settings.GEMINI_FALLBACK_MODELS.split(",")
            if m.strip() and m.strip() != settings.GEMINI_MODEL
        ]

        errors: list[str] = []
        timeout_cfg = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout_cfg) as client:
            for idx, model in enumerate(candidate_models):
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
                payload = {
                    "contents": [{"parts": [{"text": combined_prompt}]}],
                    "generationConfig": {
                        "responseMimeType": "application/json",
                        "temperature": 0.2,
                    },
                }
                started = time.perf_counter()
                try:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                _record_telemetry(
                                    "gemini",
                                    model,
                                    int((time.perf_counter() - started) * 1000),
                                    idx > 0,
                                )
                                return str(parts[0]["text"])
                        errors.append(f"{model}: HTTP 200 without text candidate")
                    else:
                        errors.append(f"{model}: HTTP {resp.status_code} ({resp.text[:140]})")
                except httpx.HTTPError as exc:
                    err_detail = str(exc) or repr(exc)
                    errors.append(f"{model}: {type(exc).__name__} {err_detail}")

        raise LLMProviderUnavailableError(
            f"All configured Gemini models failed or are experiencing temporary high load. Details: {'; '.join(errors)}"
        )

    async def _call_openai(
        self, system_prompt: str, user_prompt: str, schema_cls: Type[BaseModel]
    ) -> str:
        if not settings.OPENAI_API_KEY:
            raise LLMProviderUnavailableError(
                "OPENAI_API_KEY is not configured in ai-service/.env."
            )

        schema_json = json.dumps(schema_cls.model_json_schema(), indent=2)
        started = time.perf_counter()
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                json={
                    "model": settings.OPENAI_MODEL,
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2,
                    "messages": [
                        {
                            "role": "system",
                            "content": f"{system_prompt}\nRespond strictly in valid JSON adhering to:\n{schema_json}",
                        },
                        {"role": "user", "content": user_prompt},
                    ],
                },
            )
            if resp.status_code != 200:
                raise LLMProviderUnavailableError(
                    f"OpenAI API returned HTTP {resp.status_code}: {resp.text[:200]}"
                )
            data = resp.json()
            _record_telemetry(
                "openai",
                settings.OPENAI_MODEL,
                int((time.perf_counter() - started) * 1000),
                False,
            )
            return str(data["choices"][0]["message"]["content"])

    async def transcribe_audio_bytes(
        self, audio_bytes: bytes, mime_type: str, filename: str
    ) -> str:
        provider = settings.LLM_PROVIDER.lower().strip()

        if provider == "openai":
            if not settings.OPENAI_API_KEY:
                raise LLMProviderUnavailableError(
                    "OPENAI_API_KEY is not configured in ai-service/.env for Whisper STT."
                )
            async with httpx.AsyncClient(timeout=45.0) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                    data={"model": "whisper-1"},
                    files={"file": (filename, audio_bytes, mime_type)},
                )
                if resp.status_code != 200:
                    raise LLMProviderUnavailableError(
                        f"OpenAI Whisper returned HTTP {resp.status_code}: {resp.text[:200]}"
                    )
                return str(resp.json().get("text", "")).strip()

        if provider == "gemini":
            if not settings.GEMINI_API_KEY:
                raise LLMProviderUnavailableError(
                    "GEMINI_API_KEY is not configured in ai-service/.env for speech transcription."
                )
            b64_audio = base64.b64encode(audio_bytes).decode("ascii")
            candidate_models = [settings.GEMINI_MODEL] + [
                m.strip()
                for m in settings.GEMINI_FALLBACK_MODELS.split(",")
                if m.strip() and m.strip() != settings.GEMINI_MODEL
            ]
            errors: list[str] = []
            async with httpx.AsyncClient(timeout=httpx.Timeout(35.0, connect=10.0)) as client:
                for model in candidate_models:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
                    payload = {
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": (
                                            "Transcribe all spoken words in this interview audio recording accurately verbatim. "
                                            "Return ONLY the spoken transcript plain text without markdown or commentary. "
                                            "If completely silent, return an empty string."
                                        )
                                    },
                                    {"inlineData": {"mimeType": mime_type, "data": b64_audio}},
                                ]
                            }
                        ],
                        "generationConfig": {"temperature": 0.0},
                    }
                    try:
                        started = time.perf_counter()
                        resp = await client.post(url, json=payload)
                        if resp.status_code == 200:
                            data = resp.json()
                            candidates = data.get("candidates", [])
                            if candidates:
                                parts = candidates[0].get("content", {}).get("parts", [])
                                if parts and "text" in parts[0]:
                                    _record_telemetry(
                                        "gemini-stt",
                                        model,
                                        int((time.perf_counter() - started) * 1000),
                                        False,
                                    )
                                    return str(parts[0]["text"]).strip()
                            return ""
                        errors.append(f"{model}: HTTP {resp.status_code}")
                    except httpx.HTTPError as exc:
                        errors.append(f"{model}: {type(exc).__name__} {exc}")
            raise LLMProviderUnavailableError(
                f"Speech-to-text transcription unavailable: {'; '.join(errors)}"
            )

        raise LLMProviderUnavailableError(f"Unsupported LLM_PROVIDER '{settings.LLM_PROVIDER}' for audio STT.")

    async def stream_text(self, system_prompt: str, user_prompt: str) -> AsyncIterator[str]:
        """Streams plain text coaching tokens from Gemini SSE endpoint (or OpenAI fallback)."""
        provider = settings.LLM_PROVIDER.lower().strip()
        if provider == "gemini" and settings.GEMINI_API_KEY:
            candidate_models = [settings.GEMINI_MODEL] + [
                m.strip()
                for m in settings.GEMINI_FALLBACK_MODELS.split(",")
                if m.strip() and m.strip() != settings.GEMINI_MODEL
            ]
            for model in candidate_models:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
                    f":streamGenerateContent?alt=sse&key={settings.GEMINI_API_KEY}"
                )
                payload = {
                    "contents": [{"parts": [{"text": f"{system_prompt}\n\n{user_prompt}"}]}],
                    "generationConfig": {"temperature": 0.35},
                }
                try:
                    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=8.0)) as client:
                        async with client.stream("POST", url, json=payload) as resp:
                            if resp.status_code != 200:
                                continue
                            yielded_any = False
                            async for line in resp.aiter_lines():
                                if not line.startswith("data:"):
                                    continue
                                raw_json = line[5:].strip()
                                if not raw_json:
                                    continue
                                try:
                                    chunk = json.loads(raw_json)
                                    candidates = chunk.get("candidates", [])
                                    if candidates:
                                        parts = candidates[0].get("content", {}).get("parts", [])
                                        if parts and "text" in parts[0]:
                                            yielded_any = True
                                            yield str(parts[0]["text"])
                                except json.JSONDecodeError:
                                    continue
                            if yielded_any:
                                return
                except httpx.HTTPError:
                    continue

        if provider == "openai" and settings.OPENAI_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=8.0)) as client:
                    async with client.stream(
                        "POST",
                        "https://api.openai.com/v1/chat/completions",
                        headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"},
                        json={
                            "model": settings.OPENAI_MODEL,
                            "stream": True,
                            "temperature": 0.35,
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                        },
                    ) as resp:
                        if resp.status_code == 200:
                            async for line in resp.aiter_lines():
                                if not line.startswith("data:"):
                                    continue
                                raw_data = line[5:].strip()
                                if raw_data == "[DONE]":
                                    return
                                try:
                                    chunk = json.loads(raw_data)
                                    delta = chunk.get("choices", [{}])[0].get("delta", {}).get("content")
                                    if delta:
                                        yield str(delta)
                                except json.JSONDecodeError:
                                    continue
            except httpx.HTTPError:
                return


llm_client = ModularLLMClient()
