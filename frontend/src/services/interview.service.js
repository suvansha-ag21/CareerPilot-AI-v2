import { apiRequest, getAccessToken, API_BASE_URL } from "@/lib/api";

export const interviewApi = {
    list: () => apiRequest("/interviews"),
    getById: (id) => apiRequest(`/interviews/${id}`),
    start: (input) => apiRequest("/interviews/start", {
        method: "POST",
        body: JSON.stringify(input),
    }),
    submitAnswer: (interviewId, input) => apiRequest(`/interviews/${interviewId}/answer`, {
        method: "POST",
        body: JSON.stringify(input),
    }),
    transcribeAudio: (interviewId, audioBlob, durationSeconds) => {
        const form = new FormData();
        const ext = audioBlob.type.includes("wav")
            ? ".wav"
            : audioBlob.type.includes("mp4")
                ? ".mp4"
                : audioBlob.type.includes("ogg")
                    ? ".ogg"
                    : ".webm";
        form.append("audio", audioBlob, `recording${ext}`);
        form.append("durationSeconds", String(durationSeconds));
        return apiRequest(`/interviews/${interviewId}/transcribe`, {
            method: "POST",
            body: form,
        });
    },
    submitVoiceAnswer: (interviewId, questionId, audioBlob, durationSeconds) => {
        const form = new FormData();
        const ext = audioBlob.type.includes("wav")
            ? ".wav"
            : audioBlob.type.includes("mp4")
                ? ".mp4"
                : audioBlob.type.includes("ogg")
                    ? ".ogg"
                    : ".webm";
        form.append("audio", audioBlob, `answer${ext}`);
        form.append("questionId", questionId);
        form.append("durationSeconds", String(durationSeconds));
        return apiRequest(`/interviews/${interviewId}/answer-voice`, {
            method: "POST",
            body: form,
        });
    },
    complete: (interviewId) => apiRequest(`/interviews/${interviewId}/complete`, {
        method: "POST",
    }),
    delete: (id) => apiRequest(`/interviews/${id}`, {
        method: "DELETE",
    }),
    streamHint: async (interviewId, questionId, onToken) => {
        const token = getAccessToken();
        const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/hint-stream`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            credentials: "include",
            body: JSON.stringify({ questionId }),
        });
        if (!res.ok || !res.body) {
            throw new Error("Could not open coaching hint stream");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line.startsWith("data:"))
                    continue;
                const payload = line.slice(5).trim();
                if (payload === "[DONE]")
                    return;
                try {
                    const parsed = JSON.parse(payload);
                    if (parsed.token)
                        onToken(parsed.token);
                }
                catch {
                    // ignore partial chunks
                }
            }
        }
    },
};
