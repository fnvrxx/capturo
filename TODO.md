# TODO: Migrasi PaddleOCR

- [x] Hapus service, konfigurasi, UI, dan mode simulasi Azure/Microsoft.
- [x] Sambungkan Laravel ke service PaddleOCR dengan URL tunnel dan Bearer token.
- [x] Hapus step serta preview JSON dari frontend; hasil OCR langsung menuju form review.
- [x] Sediakan service FastAPI dan panduan Kaggle/zrok di `paddleocr-kaggle`.
- [x] Buat Kaggle Secrets `ZROK_ENABLE_TOKEN` dan `PADDLE_OCR_TOKEN`.
- [x] Jalankan notebook Kaggle dengan Internet aktif dan GPU bila tersedia.
- [x] Salin URL zrok aktif ke `captuto-backend/.env` sebagai `PADDLE_OCR_URL`.
- [ ] Isi `PADDLE_OCR_TOKEN` yang sama pada Laravel dan Kaggle Secrets, lalu jalankan `php artisan config:clear`.
- [ ] Uji `/health`, JPG, PNG, dan PDF melalui frontend serta koreksi hasil field kosong.
- [ ] Rotasikan dan nonaktifkan kredensial Azure lama karena tidak lagi digunakan.

## Register dan login

- [x] Perbaiki CORS localhost/127.0.0.1 dan bersihkan cache konfigurasi.
- [x] Pulihkan dependensi vendor dataless sesuai composer.lock dan bangun ulang autoload.
- [x] Tampilkan pesan error register/login di form dan hentikan reload saat password salah.
- [x] Uji register, login, validasi, dan Bearer token dengan database pengujian.
- [x] Verifikasi alur pada PostgreSQL lokal dalam transaksi yang di-rollback.
- [ ] Ulangi alur register/logout/login melalui browser; panduan dan hasil ada di `AUTH_TESTING.md`.

## Bounding Box Preview

- [x] Tambahkan step preview di antara upload dan review/save.
- [x] Teruskan koordinat dan confidence tiap teks dari Laravel ke frontend.
- [x] Tampilkan polygon, confidence per kotak, pemilihan teks, zoom, dan halaman PDF.
- [x] Tambahkan gambar tiap halaman ke respons service Kaggle tanpa menyimpannya dalam audit record.
- [ ] Perbarui service.py pada Kaggle dan unggah ulang dokumen untuk preview PDF per halaman.
- [ ] Verifikasi visual dengan dokumen nyata di browser setelah service Kaggle diperbarui.
