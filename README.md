# Warung Pintar (Netlify + Gemini, kunci aman di server)

## Isi
- `index.html` : tampilan aplikasi
- `netlify/functions/scan.mjs` : fungsi server yang memanggil Gemini
- `netlify.toml` : pengaturan Netlify

## Cara pasang (lewat GitHub)
1. Upload semua file ini ke repository GitHub (struktur folder `netlify/functions/` harus sama).
2. Di app.netlify.com: Add new site > Import an existing project > GitHub > pilih repository.
3. Build command kosongkan. Klik Deploy.
4. Buka Site configuration > Environment variables > Add a variable:
   - Key: `GEMINI_API_KEY`
   - Value: kunci dari https://aistudio.google.com/apikey
5. Buka Deploys > Trigger deploy > Deploy site (supaya kunci terbaca).
6. Buka alamat situsnya di HP, foto barang belanjaan.

Catatan: drag and drop folder di Netlify TIDAK menjalankan Function. Pakai GitHub, atau Netlify CLI (`npm i -g netlify-cli`, lalu `netlify deploy --prod`).
Kalau muncul "waktu habis", itu batas 10 detik di paket gratis. Coba foto lagi dengan barang lebih sedikit.
Kalau nama model `gemini-2.5-flash` diganti Google, ubah `MODEL` di `scan.mjs`.
