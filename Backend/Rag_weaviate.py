import os
import re
import json
from typing import List, Dict, Any, Optional, Set
from enum import Enum
import time
import traceback
import datetime as dt

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain.schema import Document
from langchain_cohere import CohereEmbeddings
from sentence_transformers import CrossEncoder

import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.query import MetadataQuery, Filter

# Asumsikan Anda memiliki file ini untuk manajemen riwayat obrolan.
from chat_history_service import ChatHistoryService

# Muat environment variables dari file .env
load_dotenv()

# ============================================================================
# 1. SISTEM POLA RESPONS
# ============================================================================
class ResponsePattern(Enum):
    """Enum untuk mendefinisikan pola-pola respons yang tersedia."""
    GREETING = "greeting"
    PASAL_QUERY = "pasal_query"
    DOCUMENT_QUERY = "document_query"
    OUT_OF_CONTEXT = "out_of_context"
    GRATITUDE = "gratitude"
    FAREWELL = "farewell"
    SMALL_TALK = "small_talk"

# ============================================================================
# 2. FORMATTER RESPONS
# ============================================================================
class ResponseFormatter:
    """Class untuk memformat respons RAG yang terstruktur."""
    @staticmethod
    def format_pasal_response(pasal_number: str, content: str, source_docs: List[Any]) -> Dict[str, Any]:
        if source_docs and content:
            response = f"📖 *PASAL {pasal_number}*\n\n{content}\n\n"
            response += "=" * 35 + "\n"
            response += "📚 *SUMBER PASAL:*\n"
            response += "=" * 35 + "\n"
            for i, doc in enumerate(source_docs[:2], 1):
                metadata = doc.metadata
                source_name = metadata.get("source", "Dokumen Hukum")
                response += f"{i}. {source_name}"
                if metadata.get("page") and str(metadata.get("page")) != "?":
                    response += f" | Hal. {metadata.get('page')}"
                response += "\n"
        else:
            response = f"❌ *PASAL {pasal_number} TIDAK DITEMUKAN*\n\nMaaf, Pasal {pasal_number} tidak ditemukan dalam dokumen yang tersedia."
        return {"response": response, "source_documents": source_docs}

    @staticmethod
    def format_document_response(answer: str, source_docs: List[Any]) -> Dict[str, Any]:
        response = f"{answer.strip()}\n\n"
        if source_docs and len(source_docs) > 0:
            response += "=" * 35 + "\n"
            response += "📚 *REFERENSI:*\n"
            response += "=" * 35 + "\n"
            seen_sources = set()
            displayed_docs = 0
            for doc in source_docs:
                if displayed_docs >= 3:
                    break
                metadata = doc.metadata
                source_name = metadata.get("source", "Dokumen")
                if source_name in seen_sources:
                    continue
                seen_sources.add(source_name)
                displayed_docs += 1
                response += f"{displayed_docs}. {source_name}"
                details = []
                if metadata.get("page") and str(metadata.get("page")) != "?": details.append(f"Hal. {metadata.get('page')}")
                if metadata.get("pasal") and str(metadata.get("pasal")) != "-": details.append(f"Pasal {metadata.get('pasal')}")
                if metadata.get('rerank_score') is not None: details.append(f"Score: {metadata['rerank_score']:.3f}")
                if details: response += f" | {' | '.join(details)}"
                response += "\n"
        else:
            response += "ℹ Tidak ada sumber spesifik ditemukan untuk pertanyaan ini."
        return {"response": response, "source_documents": source_docs}

    @staticmethod
    def format_out_of_context_response() -> Dict[str, Any]:
        response = "Maaf, saya tidak menemukan jawaban sesuai dengan sumber dokumen."
        return {"response": response, "source_documents": []}

# ============================================================================
# 3. KONFIGURASI APLIKASI FASTAPI
# ============================================================================
app = FastAPI(
    title="Dynamic Legal RAG System API",
    description="Sistem RAG canggih dengan Hybrid Search, Re-ranking, dan respons percakapan dinamis.",
    version="4.3.0-logging"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.middleware("http")
async def add_process_time_header(request, call_next):
    """
    Middleware untuk mengukur waktu total pemrosesan setiap request.
    """
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time

    # Menambahkan waktu proses ke header respons, bisa dilihat di browser dev tools
    response.headers["X-Process-Time"] = f"{process_time:.4f}" 

    # Mencetak log waktu ke konsol server agar mudah dilihat saat development
    print(f"🚀 Total Waktu Respons untuk {request.url.path}: {process_time:.4f} detik")

    return response

# ============================================================================
# 4. KELAS KONFIGURASI UTAMA
# ============================================================================
class Config:
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    COHERE_API_KEY = os.getenv("COHERE_API_KEY")
    WEAVIATE_URL = os.getenv("WEAVIATE_URL")
    WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
    WEAVIATE_CLASS_NAME = os.getenv("WEAVIATE_CLASS_NAME")
    COHERE_EMBEDDING_MODEL = "embed-multilingual-v3.0"
    GROQ_MODEL = "llama-3.3-70b-versatile"
    CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    MAX_TOKENS = 4096
    TEMPERATURE = 0.1
    SEARCH_LIMIT = 5
    ALPHA = 0.5
    RERANK_TOP_K = 2
config = Config()
if not all([config.GROQ_API_KEY, config.COHERE_API_KEY, config.WEAVIATE_URL, config.WEAVIATE_API_KEY, config.WEAVIATE_CLASS_NAME]):
    raise ValueError("Pastikan semua variabel environment telah diatur dalam file .env")

# ============================================================================
# 5. KONEKSI & INISIALISASI MODEL
# ============================================================================
print("🚀 Memulai Inisialisasi Sistem...")
try:
    print("🔗 Menghubungkan ke Weaviate Cloud...")
    client = weaviate.connect_to_weaviate_cloud(cluster_url=config.WEAVIATE_URL, auth_credentials=Auth.api_key(config.WEAVIATE_API_KEY))
    if not client.is_ready(): raise ConnectionError("Koneksi Weaviate gagal.")
    weaviate_collection = client.collections.get(config.WEAVIATE_CLASS_NAME)
    print(f"✅ Terhubung ke Weaviate. Koleksi '{config.WEAVIATE_CLASS_NAME}' siap.")
except Exception as e:
    print(f"❌ Gagal terhubung ke Weaviate: {e}"); raise
print("🤖 Menginisialisasi model AI...")
embeddings = CohereEmbeddings(cohere_api_key=config.COHERE_API_KEY, model=config.COHERE_EMBEDDING_MODEL)
llm = ChatGroq(model_name=config.GROQ_MODEL, temperature=config.TEMPERATURE, max_tokens=config.MAX_TOKENS)
cross_encoder = CrossEncoder(config.CROSS_ENCODER_MODEL)
print("✅ Semua model berhasil dimuat.")

# ============================================================================
# 6. PROMPT TEMPLATES & FUNGSI PEMROSESAN
# ============================================================================
conversational_prompt_template = """Anda adalah asisten AI Penjaminan mutu yang ramah dan profesional.
Tugas Anda adalah merespons sapaan atau percakapan santai dari pengguna.
Jawab dengan singkat, sopan, dan dalam bahasa Indonesia. Jangan menjawab pertanyaan substantif tentang hukum.
Pesan Pengguna: "{user_message}"
Respons Anda:"""
conversational_prompt = PromptTemplate(template=conversational_prompt_template, input_variables=["user_message"])

rag_with_memory_and_cot_template = """Anda adalah asisten AI Penjaminan Mutu yang sangat cerdas.
Tugas Anda adalah menjawab pertanyaan pengguna secara akurat berdasarkan riwayat percakapan sebelumnya dan konteks dokumen yang baru diberikan.

RIWAYAT PERCAKAPAN SEBELUMNYA:
{chat_history}

KONTEKS DOKUMEN YANG RELEVAN DENGAN PERTANYAAN TERAKHIR:
{context}

PERTANYAAN TERAKHIR DARI PENGGUNA: {question}

INSTRUKSI UNTUK ANDA:
1.  **Analisis**: Pahami pertanyaan terakhir pengguna dalam konteks riwayat percakapan.
2.  **Penalaran (Chain-of-Thought)**: Secara internal, pikirkan langkah-langkah untuk menjawab. Pertama, rangkum informasi relevan dari riwayat dan konteks dokumen. Kedua, susun jawaban yang koheren dan logis.
3.  **Jawaban**: Jawab pertanyaan pengguna HANYA berdasarkan informasi dari RIWAYAT dan KONTEKS. Jika informasi tidak cukup, katakan dengan jujur. Jawaban harus dalam bahasa Indonesia, jelas, dan ringkas.
    
    **PENTING: Aturan Pemformatan Jawaban**
    - **Identifikasi Daftar**: Jika Anda menemukan daftar dalam KONTEKS (seperti daftar visi, misi, atau poin-poin), **WAJIB** format ulang menjadi daftar Markdown.
    - **Gunakan Tanda Hubung**: Untuk daftar poin, gunakan tanda hubung (`- `) di awal setiap item. Contoh: `- Poin pertama.`
    - **Gunakan Angka**: Untuk daftar bernomor, gunakan angka (`1. `, `2. `).
    - **Gunakan Penekanan**: Gunakan `**teks tebal**` untuk judul atau istilah penting.

4.  **Format Output**: Berikan output dalam format berikut (PENTING!):
    *PEMIKIRAN:* [Tulis proses berpikir Anda di sini. Contoh: "Konteks berisi daftar misi. Saya akan memformatnya ulang menggunakan tanda hubung."]
    *JAWABAN:* [Tulis jawaban akhir yang akan dibaca pengguna di sini, dalam format Markdown.]

OUTPUT ANDA:"""
rag_with_memory_and_cot_prompt = PromptTemplate(
    template=rag_with_memory_and_cot_template,
    input_variables=["chat_history", "context", "question"]
)

def generate_conversational_response(user_message: str) -> str:
    print("💬 Menghasilkan respons percakapan dengan LLM...")
    formatted_prompt = conversational_prompt.format(user_message=user_message)
    response = llm.invoke(formatted_prompt)
    return response.content.strip()

def hybrid_search_weaviate(query: str) -> List[Document]:
    try:
        query_embedding = embeddings.embed_query(query)
        response = weaviate_collection.query.hybrid(query=query, vector=query_embedding, alpha=config.ALPHA, limit=config.SEARCH_LIMIT, return_metadata=MetadataQuery(score=True))
        return [Document(page_content=obj.properties.get('content', ''), metadata={**obj.properties, 'hybrid_score': obj.metadata.score if obj.metadata else 0, 'weaviate_id': str(obj.uuid)}) for obj in response.objects]
    except Exception as e:
        print(f"Error dalam hybrid search: {e}"); return []

def rerank_documents(query: str, documents: List[Document]) -> List[Document]:
    if not documents: return []
    scores = cross_encoder.predict([[query, doc.page_content] for doc in documents])
    for doc, score in zip(documents, scores): doc.metadata['rerank_score'] = float(score)
    return sorted(documents, key=lambda x: x.metadata['rerank_score'], reverse=True)

def detect_query_pattern(message: str) -> ResponsePattern:
    message_lower = message.lower().strip()
    if re.search(r'^(hai|hello|hi|halo|selamat\s+(pagi|siang|sore|malam)|apa\s+kabar)', message_lower): return ResponsePattern.GREETING
    if re.search(r'terima\s+kasih|thank\s+you|makasih', message_lower): return ResponsePattern.GRATITUDE
    if re.search(r'sampai\s+jumpa|goodbye|bye', message_lower): return ResponsePattern.FAREWELL
    if re.search(r"pasal\s+(\d+)|ps\s*\.?\s*(\d+)|pasal\s+ke[\s-]*(\d+)", message_lower): return ResponsePattern.PASAL_QUERY
    if len(message_lower.split()) <= 3 and len(message_lower) <= 20: return ResponsePattern.SMALL_TALK
    return ResponsePattern.DOCUMENT_QUERY

def search_pasal_specific(pasal_number: str) -> Dict[str, Any]:
    try:
        query_embedding = embeddings.embed_query(f"Isi lengkap dari pasal {pasal_number}")
        response = weaviate_collection.query.near_vector(near_vector=query_embedding, limit=5, filters=Filter.by_property("pasal").equal(pasal_number))
        matched_docs = [Document(page_content=obj.properties.get('content', ''), metadata=obj.properties) for obj in response.objects]
        if matched_docs:
            full_content = "\n\n".join([doc.page_content.strip() for doc in matched_docs if doc.page_content.strip()])
            return ResponseFormatter.format_pasal_response(pasal_number, full_content, matched_docs)
        return ResponseFormatter.format_pasal_response(pasal_number, "", [])
    except Exception as e:
        print(f"Error dalam pencarian pasal spesifik: {e}"); return ResponseFormatter.format_out_of_context_response()

# ============================================================================
# 7. FUNGSI PROSESOR & EVALUASI
# ============================================================================
def process_query_for_evaluation(user_message: str) -> Dict[str, Any]:
    """
    Fungsi ini menjalankan alur RAG utama dan mengembalikan output mentah
    yang dibutuhkan oleh RAGAS untuk evaluasi. TIDAK MENGGUNAKAN HISTORI.
    """
    try:
        print(f"🔬 [EVAL] Memproses: '{user_message}'")
        
        initial_docs = hybrid_search_weaviate(user_message)
        if not initial_docs:
            return {"question": user_message, "answer": "Tidak ada dokumen yang ditemukan.", "contexts": []}
        
        reranked_docs = rerank_documents(user_message, initial_docs)
        final_docs = reranked_docs[:config.RERANK_TOP_K]
        
        contexts_list = [doc.page_content for doc in final_docs]
        context_string = "\n\n---\n\n".join(contexts_list)

        formatted_prompt = rag_with_memory_and_cot_prompt.format(
            chat_history="Tidak ada riwayat percakapan.",
            context=context_string,
            question=user_message
        )
        
        llm_output = llm.invoke(formatted_prompt).content
        
        answer_match = re.search(r"\*JAWABAN:\*([\s\S]*)", llm_output, re.IGNORECASE)
        if answer_match:
            answer = answer_match.group(1).strip()
        else:
            answer = llm_output.strip().removeprefix("*PEMIKIRAN:*").strip()

        return {
            "question": user_message,
            "answer": answer,
            "contexts": contexts_list
        }

    except Exception as e:
        print(f"❌ ERROR dalam proses evaluasi RAG: {traceback.format_exc()}"); 
        return {"question": user_message, "answer": "Terjadi error saat pemrosesan.", "contexts": []}

def process_query(user_message: str, user_id: Optional[str] = None, chat_id: Optional[str] = None) -> tuple[str, List[Any]]:
    pattern = detect_query_pattern(user_message)
    conversational_patterns: Set[ResponsePattern] = {
        ResponsePattern.GREETING, ResponsePattern.GRATITUDE, ResponsePattern.FAREWELL, ResponsePattern.SMALL_TALK
    }

    if pattern in conversational_patterns:
        return generate_conversational_response(user_message), []

    elif pattern == ResponsePattern.PASAL_QUERY:
        match = re.search(r"(\d+)", user_message)
        if match:
            result = search_pasal_specific(match.group(1))
            return result["response"], result["source_documents"]

    try:
        print(f"🔄 Memproses DOCUMENT_QUERY: '{user_message}' dengan konteks histori")
        
        initial_docs = hybrid_search_weaviate(user_message)
        if not initial_docs:
            return ResponseFormatter.format_out_of_context_response()["response"], []
        
        reranked_docs = rerank_documents(user_message, initial_docs)
        final_docs = reranked_docs[:config.RERANK_TOP_K]
        context = "\n\n---\n\n".join([doc.page_content for doc in final_docs])

        chat_history = "Tidak ada riwayat percakapan."
        if user_id and chat_id:
            try:
                history_messages = ChatHistoryService.get_recent_messages(user_id, chat_id, limit=4)
                if history_messages:
                    formatted_history = []
                    for msg in history_messages:
                        role = "Pengguna" if msg.get('role') == 'user' else 'Asisten'
                        formatted_history.append(f"{role}: {msg.get('content', '')}")
                    chat_history = "\n".join(formatted_history)
                    print(f"📚 Konteks histori ditemukan untuk chat_id: {chat_id}")
            except Exception as e:
                print(f"⚠️ Gagal mengambil riwayat obrolan: {e}")

        formatted_prompt = rag_with_memory_and_cot_prompt.format(
            chat_history=chat_history,
            context=context,
            question=user_message
        )
        
        llm_output = llm.invoke(formatted_prompt).content
        
        answer_match = re.search(r"\*JAWABAN:\*([\s\S]*)", llm_output, re.IGNORECASE)
        if answer_match:
            answer = answer_match.group(1).strip()
        else:
            print("⚠️ Peringatan: LLM tidak mengikuti format PEMIKIRAN/JAWABAN. Menggunakan output penuh.")
            answer = llm_output.strip().removeprefix("*PEMIKIRAN:*").strip()

        if any(phrase in answer.lower() for phrase in ["tidak ada dalam konteks", "tidak tersedia dalam dokumen", "maaf, informasi"]):
            return ResponseFormatter.format_out_of_context_response()["response"], []

        # ====================================================================
        # ✨✨✨ BLOK LOGGING UNTUK EVALUASI MANUAL (DIPERBARUI) ✨✨✨
        # ====================================================================
        print("\n\n" + "="*60)
        print("✨ LOG UNTUK EVALUASI MANUAL (SALIN KE EXCEL) ✨")
        print(f"Waktu: {dt.datetime.now()}")
        print("-"*60)
        
        # 1. Cetak Pertanyaan
        print(f"PERTANYAAN (untuk kolom 'question'):\n{user_message}\n")
        
        # 2. Cetak Jawaban yang Dihasilkan Mesin
        print(f"JAWABAN (untuk kolom 'answer'):\n{answer}\n")
        
        # 3. Cetak Konteks dalam format JSON yang rapi
        print("KONTEKS (Salin semua di bawah ini ke dalam satu sel Excel untuk kolom 'contexts'):")
        contexts_list_for_ragas = [doc.page_content for doc in final_docs] if final_docs else []
        
        # Format sebagai string JSON yang rapi dan mudah dibaca/disalin
        json_contexts = json.dumps(contexts_list_for_ragas, ensure_ascii=False, indent=2)
        print(json_contexts)
        print("="*60 + "\n\n")
        # ====================================================================
        # ✨✨✨ AKHIR BLOK LOGGING ✨✨✨
        # ====================================================================

        result = ResponseFormatter.format_document_response(answer, final_docs)
        return result["response"], result["source_documents"]

    except Exception as e:
        print(f"❌ ERROR dalam proses RAG: {traceback.format_exc()}"); 
        return "❌ *SISTEM ERROR*\n\nTerjadi kesalahan internal. Silakan coba lagi.", []

# ============================================================================
# 8. MODEL DATA & ENDPOINTS API
# ============================================================================
class ChatRequest(BaseModel):
    user_message: str
    user_id: Optional[str] = None
    chat_id: Optional[str] = None

class ContinueChatRequest(BaseModel):
    user_id: str
    chat_id: str
    user_message: str

class UpdateTitleRequest(BaseModel):
    user_id: str
    new_title: str

class UserAuthRequest(BaseModel):
    user_id: str

@app.post("/ask", tags=["Chat"])
async def chat(request: ChatRequest):
    if not request.user_message.strip(): raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong.")
    answer, source_docs = process_query(request.user_message.strip(), request.user_id, request.chat_id)
    chat_id = request.chat_id
    if request.user_id:
        try:
            if not chat_id: chat_id = ChatHistoryService.create_chat_session(request.user_id, request.user_message)
            if chat_id:
                ChatHistoryService.save_message(request.user_id, chat_id, request.user_message, "user")
                source_metadata = [{"source": doc.metadata.get("source"), "page": doc.metadata.get("page"), "pasal": doc.metadata.get("pasal")} for doc in source_docs[:5]]
                ChatHistoryService.save_message(request.user_id, chat_id, answer, "assistant", {"sources": source_metadata})
                print(f"✅ Riwayat obrolan disimpan untuk chat_id: {chat_id}")
        except Exception as e:
            print(f"⚠ Gagal menyimpan riwayat obrolan: {e}")
    return {"response": answer, "chat_id": chat_id}

@app.get("/api/chat/history/{user_id}", tags=["Chat History"])
async def get_user_chat_history(user_id: str):
    try:
        history = ChatHistoryService.get_chat_history(user_id)
        return history
    except Exception as e:
        print(f"Error getting chat history: {e}"); raise HTTPException(status_code=500, detail="Gagal mengambil riwayat obrolan")

@app.get("/api/chat/{chat_id}/messages", tags=["Chat History"])
async def get_chat_messages(chat_id: str, user_id: str):
    try:
        messages = ChatHistoryService.get_chat_messages(user_id, chat_id)
        return {"messages": messages}
    except Exception as e:
        print(f"Error getting chat messages: {e}"); raise HTTPException(status_code=500, detail="Gagal mengambil pesan obrolan")

@app.post("/api/chat/continue", tags=["Chat History"])
async def continue_chat(request: ContinueChatRequest):
    if not request.user_message.strip(): raise HTTPException(status_code=400, detail="Pesan tidak boleh kosong.")
    answer, source_docs = process_query(request.user_message.strip(), request.user_id, request.chat_id)
    try:
        ChatHistoryService.save_message(request.user_id, request.chat_id, request.user_message, "user")
        source_metadata = [{"source": doc.metadata.get("source"), "page": doc.metadata.get("page"), "pasal": doc.metadata.get("pasal")} for doc in source_docs[:5]]
        ChatHistoryService.save_message(request.user_id, request.chat_id, answer, "assistant", {"sources": source_metadata})
    except Exception as e:
        print(f"Error continuing chat: {e}"); raise HTTPException(status_code=500, detail="Gagal melanjutkan obrolan")
    return {"response": answer}

@app.delete("/api/chat/{chat_id}", tags=["Chat History"])
async def delete_chat(chat_id: str, request: UserAuthRequest):
    try:
        success = ChatHistoryService.delete_chat(request.user_id, chat_id)
        if success: return {"message": "Obrolan berhasil dihapus"}
        else: raise HTTPException(status_code=404, detail="Gagal menghapus obrolan.")
    except Exception as e:
        print(f"Error deleting chat: {e}"); raise HTTPException(status_code=500, detail="Terjadi kesalahan saat menghapus obrolan")

@app.put("/api/chat/{chat_id}/title", tags=["Chat History"])
async def update_chat_title(chat_id: str, request: UpdateTitleRequest):
    if not request.new_title.strip(): raise HTTPException(status_code=400, detail="Judul baru tidak boleh kosong.")
    try:
        success = ChatHistoryService.update_chat_title(request.user_id, chat_id, request.new_title.strip())
        if success: return {"message": "Judul obrolan berhasil diperbarui"}
        else: raise HTTPException(status_code=404, detail="Gagal memperbarui judul.")
    except Exception as e:
        print(f"Error updating chat title: {e}"); raise HTTPException(status_code=500, detail="Terjadi kesalahan saat memperbarui judul")

@app.get("/", tags=["Status"])
async def root():
    return {"message": "Dynamic Legal RAG System API is running.", "version": "4.2.0-memory", "documentation": "/docs"}

@app.get("/health", tags=["Status"])
async def health_check():
    return {
        "status": "healthy",
        "weaviate_connection": client.is_ready(),
        "firestore_connection": ChatHistoryService.db is not None,
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat()
    }

@app.get("/patterns", tags=["Status"])
async def get_response_patterns():
    return {pattern.name: pattern.value for pattern in ResponsePattern}

# ============================================================================
# 9. EKSEKUSI APLIKASI
# ============================================================================
if __name__ == "__main__":
    import uvicorn
    print("🎉 Sistem Siap! Menjalankan server Uvicorn di http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
