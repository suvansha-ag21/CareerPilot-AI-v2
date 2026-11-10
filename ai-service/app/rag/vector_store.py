from pathlib import Path
from typing import Dict, List
import chromadb
from app.core.config import settings
from app.models.nlp_loader import get_embedding_model


class ChromaVectorStore:
    def __init__(self) -> None:
        persist_path = Path(settings.CHROMA_PERSIST_DIR).resolve()
        persist_path.mkdir(parents=True, exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(persist_path))
        self._resume_collection = self._client.get_or_create_collection(
            name="resume_chunks",
            metadata={"hnsw:space": "cosine"},
        )

    def index_resume_chunks(
        self, user_id: str, resume_id: str, chunks: List[Dict[str, str]]
    ) -> int:
        # Remove prior chunks for same resume cleanly before upserting
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

    def delete_resume_chunks(self, user_id: str, resume_id: str) -> None:
        self._resume_collection.delete(
            where={"$and": [{"user_id": user_id}, {"resume_id": resume_id}]}
        )


vector_store = ChromaVectorStore()
