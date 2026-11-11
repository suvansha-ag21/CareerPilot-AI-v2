from pathlib import Path
from typing import Dict, List
import chromadb
from chromadb.config import Settings as ChromaSettings
from sklearn.metrics.pairwise import cosine_similarity
from app.core.config import settings
from app.models.nlp_loader import get_embedding_model


class ChromaVectorStore:
    def __init__(self) -> None:
        persist_path = Path(settings.CHROMA_PERSIST_DIR).resolve()
        persist_path.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(
            path=str(persist_path),
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._resume_collection = self._client.get_or_create_collection(
            name="resume_chunks",
            metadata={"hnsw:space": "cosine"},
        )

    def index_resume_chunks(
        self, user_id: str, resume_id: str, chunks: List[Dict[str, str]]
    ) -> int:
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
                    # Chroma cosine distance = 1 - cosine_similarity
                    sim = max(0.0, 1.0 - float(dist_list[0]))
                    best_sims.append(sim)
        else:
            # Fallback direct embedding comparison if chunks were missing from Chroma
            resume_emb = embedder.encode([fallback_resume_text[:4000]], normalize_embeddings=True)
            sims = cosine_similarity(clause_embeddings, resume_emb).flatten()
            best_sims = [max(0.0, float(s)) for s in sims]

        if not best_sims:
            return 0.0

        avg_cos = sum(best_sims) / len(best_sims)
        # BGE/MiniLM cosine scores on relevant technical pairs usually span 0.35 - 0.82.
        # Map cleanly without inflating unrelated pairs.
        calibrated = min(100.0, max(0.0, ((avg_cos - 0.20) / 0.58) * 100.0))
        return round(calibrated, 1)

    def delete_resume_chunks(self, user_id: str, resume_id: str) -> None:
        self._resume_collection.delete(
            where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]}
        )


vector_store = ChromaVectorStore()
