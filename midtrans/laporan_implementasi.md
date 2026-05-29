# 📁 LAPORAN IMPLEMENTASI: GATEWAY PEMBAYARAN MIDTRANS & TRANSFER MANUAL
**STATUS:** SHIPPED & PRODUCTION-READY  
**TANGGAL:** 2026-05-30  
**TEKNOLOGI:** Next.js 15 (App Router), Drizzle ORM, Neon Postgres, Clerk Auth, Cloudinary  

Laporan ini mendokumentasikan keputusan arsitektur, detail implementasi skema database, alur kontrol logika, strategi keamanan, analisis stock FSM, serta catatan *Technical Debt* (Fase 5 & Fase 6) untuk integrasi gerbang pembayaran di Erlinshop.

---

## 🛠️ Keputusan Arsitektur (ADR-059)
### Konteks
Erlinshop memerlukan penggabungan dua sistem pembayaran utama:
1. **Midtrans Gateway:** Otomatis (QRIS, Kartu Kredit, Virtual Account bank).
2. **Transfer Manual:** Melalui rekening bank toko yang diverifikasi admin secara backoffice.

### Keputusan (ADR-059: Decoupled Payment & Order State)
Kami menerapkan **Opsi A (Decoupled State)** yang memisahkan **Status Logistik Order** (`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`) dari **Status Pembayaran** (`UNPAID`, `PENDING_VERIFICATION`, `PAID`, `EXPIRED`, `FAILED`).
* **Mengapa?** Ini menjamin ketahanan audit keuangan, mempermudah pelacakan, serta mencegah lompatan status ilegal pada Finite State Machine (FSM) pesanan.

---

## 💾 Eksplorasi Skema Database
Perubahan database telah sinkron secara aman melalui `npx drizzle-kit push` ke server Neon Postgres:

### A. Tabel Baru: `manual_bank_accounts`
Penyimpanan rekening bank manual aktif yang dikelola dinamis oleh Admin:
* `id` (Text Primary Key, CUID2 prefix: `BNK-`)
* `bank_name` (Text, BCA/Mandiri/dll)
* `account_number` (Text, Nomor Rekening)
* `account_holder` (Text, Atas Nama)
* `is_active` (Boolean, status keaktifan)

### B. Tambahan Kolom Baru pada Tabel `orders`
* `payment_method` (Enum: `MIDTRANS` | `MANUAL_TRANSFER` | `UNSET`)
* `payment_status` (Enum: `UNPAID` | `PENDING_VERIFICATION` | `PAID` | `EXPIRED` | `FAILED`)
* `snap_token` & `snap_redirect_url` (Text Nullable, token Snap Midtrans)
* `payment_proof_url` (Text Nullable, bukti transfer Cloudinary)
* `payment_bank_account_id` (Fk ke `manual_bank_accounts`)
* `paid_at` (Timestamp Nullable, waktu lunas)

---

## 🔄 Alur Kontrol Logika ("Smart Client, Dumb Server")

### 1. Pembayaran Otomatis Midtrans
* **Client (Smart):** Memicu `createOrder` -> Request token Midtrans -> Memanggil Snap.js SDK browser (`window.snap.pay`) -> Membuka Popup Barcode/QRIS instan di layar.
* **Server (Dumb):** Validasi order -> API POST Call ke Midtrans Snap -> Menyimpan token ke Postgres -> Menyerahkan token ke Client.

### 2. Pembayaran Transfer Bank Manual
* **Client (Smart):** Ambil daftar bank -> Salin rekening sekali klik -> Unggah bukti foto langsung ke Cloudinary -> Kirim request konfirmasi beserta URL gambar bukti.
* **Server (Dumb):** Validasi input -> Hubungkan FK rekening bank -> Simpan URL bukti transfer -> Set status pembayaran `PENDING_VERIFICATION`.

---

## 🔒 Strategi Keamanan Webhook Midtrans (Three-Tier)
1. **Lapis 1 (Signature Verification):** Server menghitung ulang SHA512 signature secara lokal menggunakan parameter: `order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY` dari environment server. Jika tidak cocok dengan `signature_key` dari request, server menolak request (`401 Unauthorized`).
2. **Lapis 2 (Direct status check):** Server Next.js melakukan *outgoing fetch* langsung ke endpoint verifikasi resmi Midtrans (`GET /v2/{order_id}/status`) menggunakan kredensial privat untuk menjamin status pembayaran valid tanpa bergantung pada manipulasi payload client.
3. **Lapis 3 (Idempotency Guard):** Server memverifikasi status pembayaran di database sebelum melakukan update. Jika status sudah `PAID`, abaikan proses pengulangan (replay attack) untuk mencegah double-trigger.

---

## 📈 Analisis Alur Kontrol Stok & FSM (Finite State Machine)

Kami telah meninjau codebase Erlinshop untuk memahami secara mendalam alur pengurangan dan pengembalian stok varian produk.

### Aturan Transisi FSM & Pengurangan Stok Aktif:
* **PENDING $\rightarrow$ PROCESSING (Paid / Approved):** **TIDAK ADA Perubahan Stok**.
  * Baik melalui webhook sukses Midtrans (`settlement`) maupun verifikasi manual Admin, status pembayaran bergeser ke `PAID` dan status logistik bergeser ke `PROCESSING` secara otomatis. Stok sengaja tidak dikurangi di sini agar sistem tidak mengalami "Stock Locking" (penguncian stok yang tidak adil bagi pembeli lain jika pesanan gagal bayar).
* **PROCESSING $\rightarrow$ COMPLETED (Selesai):** **STOK BERKURANG (Decrement)**.
  * Ketika proses produksi selesai dan admin mengirim produk (Tandai Selesai), fungsi `decrementStock()` di database transaksi berjalan untuk memotong stok fisik varian secara atomik.
* **COMPLETED $\rightarrow$ CANCELLED (Batal):** **STOK KEMBALI (Increment)**.
  * Jika pesanan yang sudah selesai terpaksa dibatalkan, fungsi `incrementStock()` dipanggil untuk mengembalikan stok fisik varian ke inventaris toko secara otomatis.
* **PENDING / PROCESSING $\rightarrow$ CANCELLED (Batal sebelum Selesai):** **TIDAK ADA Perubahan Stok**.
  * Pembatalan pesanan sebelum masuk tahap penyelesaian logistik aman dilakukan tanpa perlu mengembalikan stok karena stok memang belum dikurangi sejak awal.

---

## 🛡️ Pengamanan Hak Akses Owner (Dual-Key Auth Guard)
* **Verify Owner Session:** Semua aksi backoffice dilindungi oleh utilitas `verifyOwnerSession()` yang mengambil email pengguna aktif dari Clerk secara server-side dan memvalidasinya terhadap environment `process.env.ADMIN_EMAILS` (comma-separated string).
* **Blast Radius Guard:** Mencegah peretasan database atau manipulasi rekening oleh akun pengguna biasa yang berhasil masuk ke halaman admin.

---

## 📝 Catatan *Technical Debt* (Utang Teknis)

Sesuai arahan Owner dan CTO, Fase 5 dan 6 saat ini disimpan sebagai utang teknis untuk pengerjaan lanjutan:

### 1. [TECH-DEBT] Fase 5: Automated Customer WhatsApp Notifications
* **Rencana Implementasi:** Mengintegrasikan server Next.js dengan API gateway WhatsApp (seperti Fonnte atau Wablas).
* **Alur:** Server otomatis memicu pengiriman pesan konfirmasi bayar atau pelacakan barang langsung ke HP pelanggan saat webhook Midtrans lunas atau admin memverifikasi transfer manual.

### 2. [TECH-DEBT] Fase 6: Background Expired Order Cleanup (Cron Job)
* **Rencana Implementasi:** Membuat routine background service (Cron) menggunakan Next.js Route Handler/Vercel Cron.
* **Alur:** Setiap 24 jam sekali, sistem mencari pesanan berstatus `PENDING` yang pembayarannya masih `UNPAID` melewati batas kedaluwarsa Snap, lalu membatalkannya secara otomatis agar database tetap bersih.
