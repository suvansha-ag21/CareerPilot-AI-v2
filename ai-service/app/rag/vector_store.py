import logging
import tempfile
from pathlib import Path
from typing import Dict, List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import settings
from app.models.nlp_loader import get_embedding_model
from app.rag.cs_knowledge_base import CS_KB_DOCUMENTS

logger = logging.getLogger("careerpilot.vector_store")


def _resolve_chroma_path() -> Optional[Path]:
    candidates = []
    if settings.CHROMA_PERSIST_DIR:
        candidates.append(Path(settings.CHROMA_PERSIST_DIR))
    # Workspace root database/chroma_data
    candidates.append(Path(__file__).resolve().parent.parent.parent.parent / "database" / "chroma_data")
    # ai-service root chroma_data
    candidates.append(Path(__file__).resolve().parent.parent.parent / "chroma_data")
    # Current working directory candidates
    candidates.append(Path.cwd() / "database" / "chroma_data")
    candidates.append(Path.cwd() / "chroma_data")
    # System temp directory
    candidates.append(Path(tempfile.gettempdir()) / "careerpilot_chroma")

    for candidate in candidates:
        try:
            resolved = candidate.resolve()
            resolved.mkdir(parents=True, exist_ok=True)
            test_file = resolved / ".write_test"
            test_file.touch()
            test_file.unlink()
            return resolved
        except Exception:
            continue
    return None


class ChromaVectorStore:
    def __init__(self) -> None:
        self._kb_seeded = False
        self._client = None
        self._resume_collection = None
        self._cs_kb_collection = None
        self._init_client()

    def _init_client(self) -> None:
        chroma_settings = ChromaSettings(anonymized_telemetry=False)
        persist_path = _resolve_chroma_path()

        if persist_path:
            try:
                self._client = chromadb.PersistentClient(
                    path=str(persist_path),
                    settings=chroma_settings,
                )
            except Exception as exc:
                logger.warning("Failed to initialize PersistentClient at %s: %s. Using EphemeralClient.", persist_path, exc)
                self._client = chromadb.EphemeralClient(settings=chroma_settings)
        else:
            logger.warning("No writable directory found for ChromaDB persistence. Using EphemeralClient.")
            self._client = chromadb.EphemeralClient(settings=chroma_settings)

        try:
            self._resume_collection = self._client.get_or_create_collection(
                name="resume_chunks",
                metadata={"hnsw:space": "cosine"},
            )
            self._cs_kb_collection = self._client.get_or_create_collection(
                name="cs_knowledge_base",
                metadata={"hnsw:space": "cosine"},
            )
        except Exception as exc:
            logger.error("Failed to create collections on primary client: %s. Re-creating on EphemeralClient.", exc)
            self._client = chromadb.EphemeralClient(settings=chroma_settings)
            self._resume_collection = self._client.get_or_create_collection(
                name="resume_chunks",
                metadata={"hnsw:space": "cosine"},
            )
            self._cs_kb_collection = self._client.get_or_create_collection(
                name="cs_knowledge_base",
                metadata={"hnsw:space": "cosine"},
            )

    def index_resume_chunks(
        self, user_id: str, resume_id: str, chunks: List[Dict[str, str]]
    ) -> int:
        try:
            self.delete_resume_chunks(user_id=user_id, resume_id=resume_id)

            valid_chunks = [c for c in chunks if c.get("text", "").strip()]
            if not valid_chunks:
                return 0

            embedder = get_embedding_model()
            texts = [c["text"] for c in valid_chunks]
            embeddings = embedder.encode(texts, normalize_embeddings=True).tolist()

            ids = [f"{resume_id}_chunk_{idx}" for idx in range(len(valid_chunks))]
            metadatas = [
                {
                    "user_id": user_id,
                    "resume_id": resume_id,
                    "section": c.get("section", "general"),
                }
                for c in valid_chunks
            ]

            self._resume_collection.upsert(
                ids=ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            return len(ids)
        except Exception as exc:
            logger.error("Error indexing resume chunks: %s", exc)
            return 0

    def query_resume_semantic_similarity(
        self,
        user_id: str,
        resume_id: str,
        jd_clauses: List[str],
        fallback_resume_text: str,
    ) -> float:
        """
        Computes mean top-match cosine similarity between JD clauses and the user's ChromaDB
        resume chunks, calibrated to a 0-100 scale.
        """
        clauses = [c.strip() for c in jd_clauses if len(c.strip()) >= 15][:12]
        if not clauses:
            return 0.0

        try:
            embedder = get_embedding_model()
            clause_embeddings = embedder.encode(clauses, normalize_embeddings=True)

            existing = self._resume_collection.get(
                where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]},
                include=["documents"],
            )
            chunk_count = len(existing.get("ids") or [])

            if chunk_count > 0:
                res = self._resume_collection.query(
                    query_embeddings=clause_embeddings.tolist(),
                    n_results=min(2, chunk_count),
                    where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]},
                    include=["distances"],
                )
                distances_per_query = res.get("distances") or []
                best_sims: List[float] = []
                for dist_list in distances_per_query:
                    if dist_list:
                        sim = max(0.0, 1.0 - float(dist_list[0]))
                        best_sims.append(sim)
            else:
                resume_emb = embedder.encode([fallback_resume_text[:4000]], normalize_embeddings=True)
                sims = cosine_similarity(clause_embeddings, resume_emb).flatten()
                best_sims = [max(0.0, float(s)) for s in sims]

            if not best_sims:
                return 0.0

            avg_cos = sum(best_sims) / len(best_sims)
            calibrated = min(100.0, max(0.0, ((avg_cos - 0.20) / 0.58) * 100.0))
            return round(calibrated, 1)
        except Exception as exc:
            logger.error("Error querying resume semantic similarity: %s", exc)
            return 75.0

    def delete_resume_chunks(self, user_id: str, resume_id: str) -> None:
        try:
            self._resume_collection.delete(
                where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]}
            )
        except Exception as exc:
            logger.warning("Error deleting resume chunks: %s", exc)

    def ensure_cs_kb_indexed(self) -> int:
        if self._kb_seeded:
            try:
                return self._cs_kb_collection.count()
            except Exception:
                return len(CS_KB_DOCUMENTS)

        try:
            existing_count = self._cs_kb_collection.count()
            if existing_count >= len(CS_KB_DOCUMENTS):
                self._kb_seeded = True
                return existing_count

            embedder = get_embedding_model()
            texts = [f"{doc['topic']} — {doc['subtopic']}: {doc['content']}" for doc in CS_KB_DOCUMENTS]
            embeddings = embedder.encode(texts, normalize_embeddings=True).tolist()
            ids = [doc["id"] for doc in CS_KB_DOCUMENTS]
            metadatas = [
                {"topic": doc["topic"], "subtopic": doc["subtopic"]} for doc in CS_KB_DOCUMENTS
            ]
            self._cs_kb_collection.upsert(
                ids=ids,
                documents=texts,
                embeddings=embeddings,
                metadatas=metadatas,
            )
            self._kb_seeded = True
            return len(ids)
        except Exception as exc:
            logger.error("Error ensuring CS knowledge base indexed: %s", exc)
            return len(CS_KB_DOCUMENTS)

    def retrieve_cs_context(
        self, query_text: str, topic_filter: Optional[str] = None, top_k: int = 3
    ) -> List[Dict[str, str]]:
        try:
            self.ensure_cs_kb_indexed()
            embedder = get_embedding_model()
            q_emb = embedder.encode([query_text], normalize_embeddings=True).tolist()

            kwargs: dict = {
                "query_embeddings": q_emb,
                "n_results": min(top_k, len(CS_KB_DOCUMENTS)),
                "include": ["documents", "metadatas"],
            }
            if topic_filter:
                kwargs["where"] = {"topic": topic_filter}

            res = self._cs_kb_collection.query(**kwargs)
            docs = (res.get("documents") or [[]])[0]
            metas = (res.get("metadatas") or [[]])[0]

            results: List[Dict[str, str]] = []
            for idx, doc_text in enumerate(docs):
                meta = metas[idx] if idx < len(metas) else {}
                results.append(
                    {
                        "topic": str(meta.get("topic", "CS")),
                        "subtopic": str(meta.get("subtopic", "General")),
                        "content": str(doc_text),
                    }
                )
            return results
        except Exception as exc:
            logger.error("Error retrieving CS context: %s", exc)
            return []

    def retrieve_resume_context(
        self, user_id: str, resume_id: str, query_text: str, top_k: int = 3
    ) -> List[str]:
        try:
            existing = self._resume_collection.get(
                where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]},
                include=["documents"],
            )
            chunk_count = len(existing.get("ids") or [])
            if chunk_count == 0:
                return []

            embedder = get_embedding_model()
            q_emb = embedder.encode([query_text], normalize_embeddings=True).tolist()
            res = self._resume_collection.query(
                query_embeddings=q_emb,
                n_results=min(top_k, chunk_count),
                where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]},
                include=["documents"],
            )
            docs = (res.get("documents") or [[]])[0]
            return [str(d) for d in docs]
        except Exception as exc:
            logger.error("Error retrieving resume context: %s", exc)
            return []


vector_store = ChromaVectorStore()
