# Capturo

Capturo adalah aplikasi untuk mengubah dokumen seperti invoice, nota, dan formulir menjadi data terstruktur menggunakan OCR berbasis template.

## Tech Stack

<p>
  <img src="https://skillicons.dev/icons?i=react,vite,tailwind,laravel,php,python,fastapi,sqlite" alt="React, Vite, Tailwind CSS, Laravel, PHP, Python, FastAPI, dan SQLite" />
</p>

| Bagian            | Teknologi                                                             |
| ----------------- | --------------------------------------------------------------------- |
| Frontend          | React, Vite, Tailwind CSS, Zustand, Axios, PDF.js, SheetJS            |
| Backend           | Laravel, PHP, Laravel Sanctum, Maatwebsite Excel                      |
| OCR Service       | Python, FastAPI, PaddleOCR, PaddleX, Uvicorn                          |
| Database          | SQLite secara default; mendukung MySQL dan PostgreSQL melalui Laravel |
| Infrastruktur OCR | Kaggle dan zrok tunnel                                                |

## Live Demo

[Live Demo](https://drive.google.com/file/d/1DB0Xugf50qL38j3bu_nNG9MhDFcuqAw8/view?usp=sharing)

## Struktur Folder

| Folder              | Deskripsi                                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `captuto-frontend/` | Antarmuka Capturo untuk autentikasi, pengelolaan template, upload dokumen, preview bounding box, review, dan ekspor data. |
| `captuto-backend/`  | REST API Laravel untuk autentikasi, template, record, integrasi OCR, dan penyimpanan data.                                |
| `paddleocr-kaggle/` | Service PaddleOCR, notebook Kaggle, serta panduan menjalankan OCR melalui zrok.                                           |
| `deep-dive/`        | Catatan teknis yang menjelaskan arsitektur dan pola implementasi utama proyek.                                            |

## Define Problem

Proses memindahkan informasi dari dokumen ke sistem masih sering dilakukan secara manual. Cara ini memakan waktu, rentan terhadap kesalahan input, dan sulit ditingkatkan ketika jumlah dokumen bertambah.

## Insight

Setiap jenis dokumen memiliki informasi penting yang berbeda. Hasil OCR juga tidak selalu sempurna, sehingga otomatisasi tetap membutuhkan konteks field dan tahap verifikasi oleh pengguna.

## Ide

Capturo menggabungkan template field, PaddleOCR, confidence score, dan proses review dalam satu aplikasi. Pengguna dapat menentukan data yang ingin diambil, memindai dokumen, memeriksa hasil ekstraksi, lalu menyimpannya sebagai data terstruktur.

## Final Workflow

1. **Buat template** — tentukan jenis dokumen dan field yang ingin diekstrak.
2. **Pilih template** — gunakan template yang sesuai dengan dokumen.
3. **Unggah dokumen** — masukkan satu atau beberapa file JPG, PNG, PDF, CSV, XLS, atau XLSX.
4. **Ekstrak data** — PaddleOCR membaca dokumen visual, sedangkan kolom spreadsheet dicocokkan dengan field template.
5. **Preview hasil** — periksa bounding box, confidence score, dan pilih teks OCR untuk mengisi field bila diperlukan.
6. **Review dan koreksi** — tinjau setiap dokumen atau baris spreadsheet, lalu perbaiki field yang belum akurat.
7. **Simpan data** — simpan setiap hasil sebagai record yang dapat dikelola dan diekspor ke Excel.

**Dokumen → Template → Ekstraksi → Preview → Review → Data terstruktur**
