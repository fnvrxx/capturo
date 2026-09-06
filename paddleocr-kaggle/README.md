# PaddleOCR di Kaggle dengan zrok

Notebook `paddleocr_service.ipynb` menjalankan service FastAPI pada port 8000 dan membagikannya lewat zrok. Service menerima `POST /ocr` berupa multipart field `file`, memakai header `Authorization: Bearer <token>`, lalu mengembalikan `lines` berisi teks, confidence, dan bounding box.

1. Buat Kaggle Notebook Python, aktifkan **Internet** dan pilih **GPU** bila tersedia.
2. Tambahkan Kaggle Secrets bernama `ZROK_ENABLE_TOKEN` dan `PADDLE_OCR_TOKEN`. Buat token kedua secara acak dan sama persis dengan nilai Laravel.
3. Buat Kaggle Dataset privat yang berisi `service.py` dari folder ini, lalu tambahkan dataset tersebut melalui **Add Input** pada notebook. Untuk GPU T4, notebook memasang PaddlePaddle GPU 3.2.2 dari indeks CUDA 11.8 resmi, CPU-only PyTorch untuk kebutuhan registri ModelScope tanpa konflik NCCL, PaddleOCR dan PaddleX 3.7.0, serta NumPy 2.3.3 yang kompatibel dengan PaddleX. Setelah cell instalasi, **restart kernel**, lalu lanjutkan dari cell Secrets (jangan mengulang instalasi bila dependensi sudah tersedia). Notebook otomatis menyalinnya ke `/kaggle/working/service.py` sebelum Uvicorn berjalan. Instalasi awal mengunduh dependensi dan model OCR; health check dapat menunggu hingga lima menit pada startup pertama.
4. Notebook memprioritaskan executable `zrok2` (zrok v2, termasuk 2.0.4), lalu `zrok` bila hanya versi lama yang tersedia. Pada environment baru, set `ENABLE_ENVIRONMENT = True` sekali di cell tunnel; setelah berhasil, kembalikan ke `False`. Gunakan token akun yang sesuai dengan versi layanan tersebut. Notebook menjalankan tunnel dengan mode headless agar kompatibel dengan Kaggle. Salin URL yang dicetak zrok, lalu isi backend `captuto-backend/.env`:

   ```dotenv
   PADDLE_OCR_URL=https://<share-id>.share.zrok.io
   PADDLE_OCR_TOKEN=<nilai PADDLE_OCR_TOKEN yang sama>
   PADDLE_OCR_TIMEOUT=90
   ```

5. Jalankan `php artisan config:clear`, lalu uji `GET {PADDLE_OCR_URL}/health` dan unggah dokumen melalui aplikasi.

Setiap restart sesi Kaggle menghentikan FastAPI dan tunnel; jalankan ulang notebook lalu perbarui `PADDLE_OCR_URL`. Jangan menaruh token pada notebook yang dipublikasikan atau file `.env.example`.

## Jika muncul `address already in use` atau HTTP 502

`Application startup complete` berarti model selesai dimuat. Jika setelahnya muncul `address already in use`, proses baru gagal membuka port dan keluar. Respons health dari proses lama tidak membuktikan proses baru berhasil. Bila kemudian muncul `Finished server process` untuk proses lama, server yang melayani tunnel juga telah berhenti.

1. Gunakan `service.py` dan cell startup notebook terbaru. Cell memeriksa port terlebih dahulu, menggunakan ulang layanan yang sudah sehat, dan mencocokkan PID respons health dengan proses baru. Tidak perlu memasang ulang library.
2. Jalankan cell Secrets, copy service, lalu startup server. Jangan jalankan cell yang memanggil `server.terminate()` setelah server siap. Jika server lama masih memuat model, tunggu; jangan membuat Uvicorn kedua.
3. Pastikan `http://127.0.0.1:8000/health` di Kaggle mengembalikan JSON `status: ok`, `model: PaddleOCR`, dan `pid`. Cell zrok terbaru meneruskan ke alamat IPv4 yang sama dan menulis log ke `/kaggle/working/zrok.log`.
4. Salin URL dari log **persis**, termasuk `share.zrok.io` atau `shares.zrok.io`. Di terminal komputer Anda, jalankan `curl -i --max-time 15 https://<URL-zrok-aktif>/health`. Hasil harus HTTP 200 JSON; halaman HTML zrok/HTTP 502 berarti tunnel belum mencapai server.
5. Set `PADDLE_OCR_URL` pada Laravel tanpa `/health` atau `/ocr`, kemudian jalankan `php artisan config:clear`. Baru coba upload JPG/PNG/PDF. `/health` tidak memeriksa token atau menjalankan inferensi; upload `/ocr` juga harus berhasil.

Notebook memakai ulang proses sehat ketika cell dijalankan ulang. Setelah mengubah kode service atau token, hentikan hanya proses service sebelumnya, tunggu sampai selesai, lalu jalankan cell startup kembali agar perubahan termuat.

Pemeriksaan 6 September 2026, 17:28 WIB: `https://g6mk3dhfqn31.shares.zrok.io/health` mengembalikan HTTP 502 dengan halaman `zrok - bad gateway!`. Log Laravel juga mencatat 502 pada permintaan OCR, sehingga kegagalan saat itu terjadi pada jalur tunnel/server Kaggle.

## Jika `FileNotFoundError: 'zrok'` pada zrok v2

Pada zrok v2, executable bernama `zrok2`. Periksa dengan `shutil.which('zrok2')`. Cell terbaru mendeteksi executable sebelum membuka log, sehingga kesalahan binary tidak lagi meninggalkan log kosong. Pada kode lama, `open(..., 'w')` membuat/mengosongkan file log terlebih dahulu, kemudian `Popen(['zrok', ...])` gagal sebelum proses dapat menulis apa pun.

Gunakan binary yang sama untuk enable dan share; environment v1 dan v2 terpisah. Nama Kaggle Secret `ZROK_ENABLE_TOKEN` tetap boleh digunakan karena notebook meneruskan nilainya sebagai argumen CLI.

Referensi resmi: [Instalasi zrok2](https://netfoundry.io/docs/zrok/guides/install/linux/) dan [share HTTP dengan mode headless](https://netfoundry.io/docs/zrok/concepts/http/).

## Step Bounding Box Preview

Alur frontend: Select Template → Upload Document → Bounding Box Preview → Review & Save.

Service terbaru menambahkan `pages` pada respons `/ocr`. Setiap halaman memuat `page_index` (mulai 0), `width`, `height`, JPEG preview dalam data URL, dan `lines` berisi teks, confidence 0–1, serta polygon `bbox`. Gambar preview berasal dari `doc_preprocessor_res.output_img` yang sama dengan koordinat hasil OCR, sehingga tetap cocok untuk gambar, dokumen miring, dan halaman PDF. Gambar diperkecil maksimal 2000 px per sisi untuk transportasi, sedangkan ukuran koordinat asli tetap disertakan. [Struktur hasil PaddleX](https://github.com/PaddlePaddle/PaddleX/blob/develop/paddlex/inference/pipelines/ocr/result.py)

Laravel meneruskan `ocr_lines` dan `ocr_pages`. Frontend menampilkan kotak, persentase confidence setiap kotak, pilihan halaman, zoom, dan detail teks saat kotak/baris dipilih. Gambar preview hanya berada dalam hasil sesi; gambar tidak disertakan dalam audit JSON saat menyimpan record.

Untuk mengaktifkan preview PDF, perbarui file `service.py` di Kaggle lalu restart **proses service milik notebook**, copy file terbaru, dan jalankan kembali cell startup. Jika variabel `server` masih menunjuk proses service aktif:

```python
if globals().get('server') is not None and server.poll() is None:
    server.terminate()
    server.wait(timeout=30)
```

Kemudian jalankan cell copy service dan startup. Tunnel yang masih berjalan dapat tetap memakai port 8000 yang sama. Perubahan hanya pada service; tidak perlu menginstal ulang paket Paddle. JPG/PNG dapat menampilkan kotak dari respons service lama menggunakan file upload, tetapi preview PDF per halaman membutuhkan respons baru ini. Unggah ulang dokumen setelah memperbarui service untuk mendapatkan metadata halaman.

Verifikasi lokal:

```bash
python3 paddleocr-kaggle/test_preview.py
```

Tes ini memeriksa serialisasi gambar, warna, ukuran, polygon, confidence, dan halaman kosong memakai array sintetis; inferensi GPU harus tetap diverifikasi di Kaggle.
