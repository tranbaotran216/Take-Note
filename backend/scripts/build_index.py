#!/usr/bin/env python3
"""
Script to build FAISS index from existing notes in database
Must be run after adding notes to the app
"""

import os
import sys
import json
import numpy as np

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import ollama
import faiss
from src.database.database import SessionLocal
from src.database.models import Note


def build_faiss_index():
    """Build FAISS index from all notes in database"""
    db = SessionLocal()
    
    try:
        notes = db.query(Note).all()
        
        if not notes:
            print("❌ No notes found in database. Please add some notes first!")
            return False
        
        print(f"📊 Found {len(notes)} notes. Building embeddings...")
        
        # Embed all notes
        embeddings = []
        metadata = []
        failed_notes = []
        
        for i, note in enumerate(notes, 1):
            text = f"{note.title}\n{note.content}"
            try:
                print(f"  [{i}/{len(notes)}] Embedding: {note.title[:50]}...", end="\r")
                res = ollama.embed(model="nomic-embed-text", input=text)
                embedding = np.array(res['embeddings'][0], dtype='float32')
                embeddings.append(embedding)
                metadata.append({
                    "note_id": note.id,
                    "title": note.title,
                    "text": text[:500]  # Limit text length
                })
            except Exception as e:
                print(f"  ⚠️  Error embedding note {note.id}: {e}")
                failed_notes.append(note.id)
        
        print(f"\n✅ Successfully embedded {len(embeddings)} notes")
        
        if failed_notes:
            print(f"⚠️  Failed to embed {len(failed_notes)} notes: {failed_notes}")
        
        if not embeddings:
            print("❌ No embeddings created!")
            return False
        
        # Create FAISS index
        print("🔧 Creating FAISS index...", end=" ")
        embeddings_array = np.array(embeddings)
        
        # Normalize embeddings
        faiss.normalize_L2(embeddings_array)
        
        # Create index
        index = faiss.IndexFlatL2(embeddings_array.shape[1])
        index.add(embeddings_array)
        print("✅")
        
        # Save to backend/data
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)
        
        index_path = os.path.join(data_dir, "notes_index.faiss")
        metadata_path = os.path.join(data_dir, "notes_metadata.json")
        
        print(f"💾 Saving index to {index_path}...", end=" ")
        faiss.write_index(index, index_path)
        print("✅")
        
        print(f"💾 Saving metadata to {metadata_path}...", end=" ")
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)
        print("✅")
        
        print(f"\n{'='*50}")
        print(f"✅ FAISS index built successfully!")
        print(f"   - Indexed {len(metadata)} notes")
        print(f"   - Embedding dimension: {embeddings_array.shape[1]}")
        print(f"{'='*50}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error building index: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


if __name__ == "__main__":
    success = build_faiss_index()
    sys.exit(0 if success else 1)
