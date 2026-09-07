# Capturo

Capturo adalah aplikasi untuk mengubah dokumen seperti invoice, nota, dan formulir menjadi data terstruktur menggunakan OCR berbasis template.

## Define Problem

Proses memindahkan informasi dari dokumen ke sistem masih sering dilakukan secara manual. Cara ini memakan waktu, rentan terhadap kesalahan input, dan sulit ditingkatkan ketika jumlah dokumen bertambah.

## Insight

Setiap jenis dokumen memiliki informasi penting yang berbeda. Hasil OCR juga tidak selalu sempurna, sehingga otomatisasi tetap membutuhkan konteks field dan tahap verifikasi oleh pengguna.

## Ide

Capturo menggabungkan template field, PaddleOCR, confidence score, dan proses review dalam satu aplikasi. Pengguna dapat menentukan data yang ingin diambil, memindai dokumen, memeriksa hasil ekstraksi, lalu menyimpannya sebagai data terstruktur.

## Final Workflow

1. **Buat template** — tentukan jenis dokumen dan field yang ingin diekstrak.
2. **Pilih template** — gunakan template yang sesuai dengan dokumen.
3. **Unggah dokumen** — masukkan file JPG, PNG, atau PDF.
4. **Proses OCR** — PaddleOCR membaca dokumen dan mencocokkan hasilnya dengan field template.
5. **Preview hasil** — periksa posisi teks dan confidence score setiap hasil ekstraksi.
6. **Review dan koreksi** — perbaiki field yang belum akurat.
7. **Simpan data** — simpan hasil sebagai record yang dapat dikelola dan diekspor ke Excel.

**Dokumen → Template → OCR → Preview → Review → Data terstruktur**
