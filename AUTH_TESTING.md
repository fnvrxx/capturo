# Perbaikan register dan login — 6 September 2026

## Penyebab yang terbukti

1. **Origin CORS tidak cocok.** Frontend dibuka di `http://localhost:5173`, sedangkan backend membalas preflight dengan `Access-Control-Allow-Origin: http://127.0.0.1:5173`. Browser memblokir permintaan, dan frontend sebelumnya hanya menampilkan `Registration failed` ketika tidak menerima respons. Tes regresi mereproduksi ketidakcocokan ini sebelum perbaikan.
2. **Dependensi belum tersedia lokal.** Ditemukan 7.215 file `vendor` bertanda macOS `dataless`. Saat pengujian, PHP menghasilkan `include(): Read ... failed with errno=60 Operation timed out`. Log sebelumnya juga berisi `Maximum execution time of 30 seconds exceeded` pada berbagai file library. File yang belum tersedia dipulihkan dari paket sesuai `composer.lock`, kemudian autoload dibangun ulang. Pemeriksaan akhir menemukan 0 file vendor dataless.
3. **Pesan login hilang saat 401.** Interceptor Axios sebelumnya mengalihkan semua respons 401 ke `/login`, termasuk password salah pada halaman login sendiri. Sekarang respons login/register ditampilkan di form tanpa pengalihan tersebut.

## Perubahan

- `captuto-backend/config/cors.php` mengizinkan `localhost:5173` dan `127.0.0.1:5173` pada lingkungan local/testing. Produksi tetap memakai `FRONTEND_URL`.
- Cache konfigurasi Laravel lama sudah dibersihkan. Preflight pada server aktif kini membalas origin yang diminta dengan benar.
- Permintaan API menyertakan `Accept: application/json`.
- Form menampilkan error yang tetap terlihat, termasuk validasi, gangguan koneksi, dan timeout. Permintaan register/login dibatasi 45 detik; pengaturan timeout OCR tidak berubah.
- Pengujian dipaksa memakai SQLite in-memory dan tidak menggunakan cache konfigurasi lokal.

## Hasil pengujian

| Pemeriksaan | Hasil |
| --- | --- |
| Tes fitur backend: CORS, register, login, token profil, validasi, password salah | 5 tes / 35 assertion lulus |
| Tes penanganan error frontend | 3 tes lulus |
| Build frontend | Lulus; terdapat peringatan ukuran bundle |
| ESLint pada file autentikasi yang diubah | Lulus |
| ESLint seluruh proyek | Masih ada 3 error di Sidebar/RecordsDrawer dan warning pada file lain |
| Preflight HTTP pada server aktif | 204, origin localhost cocok |
| Login HTTP dengan kredensial tidak terdaftar | 401 JSON `Invalid credentials` |
| Alur melalui kernel Laravel dan PostgreSQL lokal, dalam transaksi | Register 201 → login 200 → profil 200 → password salah 401 |

Transaksi PostgreSQL di-rollback setelah pengujian; akun dan token uji tidak menjadi akun permanen. Pengujian browser interaktif belum dilakukan karena browser tidak tersedia pada sesi alat ini.

## Mengulang tes otomatis

Dari folder backend:

```bash
cd captuto-backend
php vendor/bin/phpunit --filter 'Auth(Test|CorsTest)'
```

Dari folder frontend:

```bash
cd captuto-frontend
node --test tests/authErrors.test.js
npm run build
```

## Mencoba lewat form

1. Pastikan PostgreSQL, Laravel pada port 8000, dan Vite pada port 5173 berjalan.
2. Refresh `http://localhost:5173/register`.
3. Isi nama, email yang belum terdaftar, password minimal 8 karakter, dan konfirmasi password yang identik. Company Name boleh kosong.
4. Setelah register berhasil, logout lalu login menggunakan email dan password yang sama.
5. Coba password salah: form harus tetap terbuka dan menampilkan `Invalid credentials`.

Jika pesan mengatakan email sudah digunakan, lakukan login dengan akun tersebut. Jika muncul error server baru, periksa entri terbaru di `captuto-backend/storage/logs/laravel.log`; error lama masih tersimpan di log.
