# Cognee RAG Setup

Dokumen ini menjelaskan cara mengaktifkan RAG berbasis Cognee untuk chatbot monitoring di project ini.

## 1. Environment Variables

Tambahkan ke `.env` backend:

```env
COGNEE_BASE_URL=http://localhost:8000
COGNEE_API_KEY=
COGNEE_DATASET=station_knowledge
```

Keterangan:
- `COGNEE_BASE_URL`: endpoint HTTP Cognee.
- `COGNEE_API_KEY`: opsional (isi jika instance Cognee butuh auth).
- `COGNEE_DATASET`: nama dataset knowledge base.

## 2. Siapkan Sumber Knowledge

Buat folder `knowledge/` di root project, lalu isi file `.md` atau `.txt`:

```text
knowledge/
  sop-reset-logger.md
  troubleshooting-aws.md
  faq-jaringan-stasiun.md
  postmortem-outage-region-timur.md
```

## 3. Ingest ke Cognee

Script ingest ada di:
- `scripts/cognee_ingest.py`

Contoh jalankan:

```bash
python scripts/cognee_ingest.py --dataset station_knowledge
```

Preview tanpa kirim data:

```bash
python scripts/cognee_ingest.py --dry-run
```

## 4. Tool RAG di MCP

Tool baru sudah tersedia di `chatbot/mcp_tools.py`:
- `tool_rag_station_knowledge(question, search_type="HYBRID_COMPLETION")`
- `tool_knowledge_add(text, dataset=None, run_cognify=True)`
- `tool_knowledge_retrieve(query, dataset=None, search_type="HYBRID_COMPLETION")`
- `tool_knowledge_list_datasets()`
- `tool_knowledge_list_data(dataset=None)`
- `tool_knowledge_delete_item(data_id, dataset=None, run_cognify=True)`
- `tool_knowledge_delete_dataset(dataset)`

Tool ini dipakai agent untuk pertanyaan:
- SOP
- troubleshooting
- knowledge non-realtime

Dan untuk operasi manajemen knowledge base:
- tambah knowledge
- lihat dataset dan item knowledge
- hapus item/dataset knowledge

## 5. Cara Pakai dari Chatbot

Setelah backend + chatbot aktif, tanyakan hal seperti:
- "Bagaimana SOP saat AWS DELAY lebih dari 2 jam?"
- "Apa langkah investigasi jika data AAWS NO DATA?"
- "Ringkas prosedur reset logger dan validasi pasca-reset."

## 6. Catatan Operasional

- Data realtime tetap pakai tool monitoring (`tool_get_*`).
- Data pengetahuan dokumen pakai `tool_rag_station_knowledge`.
- Untuk update knowledge, cukup update file di `knowledge/` lalu ingest ulang.
