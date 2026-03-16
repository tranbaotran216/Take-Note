import faiss
import json
import numpy as np
import ollama
import os

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_PATH = os.path.join(BACKEND_DIR, "data", "notes_index.faiss")
META_PATH = os.path.join(BACKEND_DIR, "data", "notes_metadata.json")
EMBED_MODEL = "nomic-embed-text"
AGENT = "note-agent2"

def load_meta():
    if not os.path.exists(INDEX_PATH) or not os.path.exists(META_PATH):
        raise FileNotFoundError("Required data files not found.")
    
    index = faiss.read_index(INDEX_PATH)
    with open(META_PATH, 'r', encoding="utf-8") as f:
        metadata = json.load(f)
    return index, metadata

def retrieve(query, index, metadata, k=3):
    res = ollama.embed(model=EMBED_MODEL, input=query)
    query_arr = np.array([res['embeddings'][0]], dtype='float32')
    faiss.normalize_L2(query_arr)

    distances, indices = index.search(query_arr, k)
    results = []
    for idx in indices[0]:
        if idx != -1:
            results.append(metadata[idx])
    return results

def gen_answer(query, context_items):
    context_text = '\n\n'.join([
        f"--- Note ID: {item['note_id']} ---\n{item['text']}"
        for item in context_items
    ])
    
    response = ollama.chat(
        model=AGENT,
        messages=[
            {
                "role" : "user",
                "content" : f"Note context: \n{context_text}\n\nQuestion:\n{query}"
            }
        ]
    )
    return response['message']['content']

def get_agent_respose(query):
    index, metadata = load_meta()
    context_items = retrieve(query=query, index=index, metadata=metadata)
    response = gen_answer(query=query, context_items=context_items)
    return response