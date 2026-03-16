import os
import json
import numpy as np
import faiss
import ollama
import tiktoken
from sqlalchemy.orm import Session

from ..src.database.database import SessionLocal
from ..src.database.models import Note

EMBED_MODEL = "nomic-embed-text"
VECTOR_DIM = 768

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BASE_DIR, "data", "notes_index.faiss")
META_PATH = os.path.join(BASE_DIR, "data", "notes_metadata.json")

def extract_tiptap_content(content):
    try:
        data = json.loads(content)
        def extract_text(node):
            if isinstance(node, list):
                return " ".join(extract_text(n) for n in node)
            if isinstance(node, dict):
                if node.get("type") == "text":
                    return node.get("text", "")
                if "content" in node:
                    return extract_text(node["content"])
            return ""
        return extract_text(data)
    except:
        return str(content)

def chunking_note(text, note_id, chunks_token=450, overlap=80):
    encoder = tiktoken.get_encoding("cl100k_base")
    tokens = encoder.encode(text=text)
    chunks = []
    start = 0
    while start < len(tokens):
        end = start + chunks_token
        chunks_content = encoder.decode(tokens=tokens[start:end])
        chunks.append({
            "text" : chunks_content,
            "note_id"  : note_id
        })
        start += (chunks_token-overlap)
    return chunks

def run_ingestion():
    db: Session = SessionLocal()
    os.makedirs(os.path.dirname(INDEX_PATH), exist_ok=True)
    try: 
        notes = db.query(Note).all()
        print(f"found {len(notes)} notes")

        all_chunks = []
        for note in notes:
            cleaned_text = extract_tiptap_content(note.content)
            full_text = f"Title: {note.title}\n{cleaned_text}"
            all_chunks.extend(chunking_note(full_text, note_id=note.id))

        if not all_chunks:
            print("No chunks to process.")
            return

        vectors = []
        for item in all_chunks:
            em = ollama.embed(model=EMBED_MODEL, input=item["text"])  
            vectors.append(em["embeddings"][0]) 

        numpy_vectors = np.array(vectors, dtype="float32")
        faiss.normalize_L2(numpy_vectors)
        index = faiss.IndexFlatIP(VECTOR_DIM)
        index.add(numpy_vectors)
        
        faiss.write_index(index, INDEX_PATH)
        with open(META_PATH,'w', encoding="utf-8") as f:
            json.dump(all_chunks, f, ensure_ascii=False)
        print("Success! Files created.")
    except Exception as e:
        print(f"Error when chunking database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_ingestion()