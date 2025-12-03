
# Panduan Pengguna - PDF Company Stamper

Selamat datang ke **PDF Company Stamper**. Aplikasi ini memudahkan anda meletakkan cop rasmi syarikat, tandatangan, dan kod QR pada dokumen PDF secara digital.

---

## 1. Persediaan Awal (Tetapan Syarikat)

Sebelum memulakan proses mengecop (stamping), anda perlu memasukkan maklumat syarikat anda.

1. Klik butang **Settings** (ikon gear) di penjuru kanan atas.
2. Masukkan maklumat berikut:
   - **Nama Syarikat**: (Wajib) Nama rasmi syarikat.
   - **No. Pendaftaran**: Nombor pendaftaran SSM atau perniagaan.
   - **Alamat**: Alamat syarikat.
   - **Nombor Telefon**: Untuk dihubungi.
3. **Logo Syarikat**: Anda boleh memuat naik fail gambar (PNG/JPG) untuk logo. Gunakan fail PNG latar belakang telus (transparent) untuk hasil terbaik.

### Menetapkan Tandatangan
Anda mempunyai dua pilihan untuk tandatangan:
*   **Type Signature (Tulis):** Pilih tab ini, taip nama anda, dan pilih jenis tulisan tangan (Font) yang anda suka dari senarai.
*   **Upload Image (Muat Naik):** Pilih tab ini jika anda sudah mempunyai gambar imbasan tandatangan anda sendiri (format PNG disyorkan).

> **Nota:** Tekan butang **Save** setelah selesai.

---

## 2. Menggunakan Ciri AI (Google Gemini, OpenAI, dll)

Aplikasi ini boleh disambungkan kepada pelbagai jenis AI untuk membantu anda. Anda boleh memilih penyedia (provider) yang anda suka dalam menu **Settings**.

### Konfigurasi AI
Dalam bahagian **AI Configuration**:

1.  **AI Provider (Penyedia):** Pilih antara:
    *   **Google Gemini:** (Disyorkan) Cepat dan percuma untuk kegunaan peribadi.
    *   **OpenAI (ChatGPT):** Gunakan model GPT-4o atau GPT-3.5-turbo.
    *   **Custom / Local:** Gunakan model sendiri seperti Ollama, LM Studio, atau DeepSeek.

2.  **API Key:** Masukkan kunci rahsia anda.
    *   Untuk Google: Dapatkan di [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Untuk OpenAI: Dapatkan di [OpenAI Platform](https://platform.openai.com/api-keys).
    *   Untuk Local (Ollama): Boleh tinggalkan kosong jika tidak diperlukan.

3.  **Model Name & Base URL:**
    *   Aplikasi akan menetapkan model lalai (default), tetapi anda boleh menukarnya (contoh: `gpt-4-turbo` atau `llama3`).
    *   Jika guna Custom/Local, pastikan **Base URL** betul (contoh untuk Ollama: `http://localhost:11434/v1`).

### Fungsi AI:
1.  **Cadangan Cop Automatik:**
    - Dalam Settings, selepas mengisi nama dan alamat, klik butang **"Test & Get Stamp Text Suggestion"**.
    - AI akan menyusun semula ayat supaya lebih ringkas, profesional, dan sesuai untuk format cop rasmi.

2.  **Ringkasan Dokumen (Summarize):**
    - Selepas memuat naik satu fail PDF, klik butang **"Summarize"** di bahagian atas kanan.
    - AI akan membaca dokumen anda dan memberikan ringkasan isi penting.

---

## 3. Memproses Dokumen (Stamping)

### Langkah 1: Muat Naik Fail
- Seret dan lepas (Drag & Drop) fail PDF anda ke dalam kotak yang disediakan, atau klik untuk memilih fail dari komputer.
- Anda boleh memuat naik satu fail atau banyak fail serentak (Batch Processing).

### Langkah 2: Pratonton & Ubah Suai (Preview)
Selepas fail dimuat naik, anda akan melihat paparan pratonton. Di sebelah kanan, terdapat panel kawalan **Stamp Options**:

*   **Layout (Susun Atur):**
    - Pilih posisi pratetap (Bottom-Left, Top-Right, dll).
    - Pilih **"Custom (Draggable)"** untuk mengheret cop secara bebas menggunakan tetikus atau jari (di telefon).
    - Jika mod "Custom" dipilih, anda boleh mengheret **Tandatangan** berasingan daripada **Cop Syarikat**.

*   **Appearance (Rupa):**
    - **Font Size:** Saiz teks.
    - **Color:** Tukar warna cop (Biru, Merah, Hitam, dll).
    - **Opacity:** Laraskan ketelusan (sesuai untuk watermark).

*   **Pages (Halaman):**
    - **First:** Cop hanya di muka surat pertama.
    - **Last:** Cop hanya di muka surat terakhir.
    - **All:** Cop di semua muka surat.
    - **Custom:** Masukkan nombor halaman spesifik (cth: `1-3, 5`).

*   **Content (Kandungan):**
    - Gunakan suis (switch) untuk menyembunyikan atau memaparkan Logo, Tandatangan, Tarikh, Nama Fail, atau Kod QR.

### Langkah 3: Jana & Muat Turun
1.  Apabila berpuas hati dengan pratonton, klik butang **"Generate Stamped PDF"**.
2.  Jika memproses banyak fail, butang akan bertukar menjadi **"Generate Stamped ZIP"**.
3.  Klik butang **Download** yang muncul untuk menyimpan fail yang telah siap dicop.

---

*Dikuasakan oleh React, pdf-lib, dan Integrasi AI (Gemini/OpenAI).*
