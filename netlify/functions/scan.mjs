// Netlify Function: menerima foto dari aplikasi, bertanya ke Gemini, mengembalikan daftar barang.
// Kunci disimpan di Netlify (Environment variable GEMINI_API_KEY), tidak pernah terlihat di browser.

const MODEL = "gemini-2.5-flash";

const PROMPT = `Kamu asisten warung di Indonesia. Lihat foto barang belanjaan ini. Daftarkan SETIAP jenis barang yang terlihat. Balas HANYA JSON array tanpa teks lain. Tiap elemen: {"nama":"nama barang umum, contoh Mie Instan Goreng","merek":"merek di kemasan, kosong jika tidak terbaca","jumlah":angka buah yang terlihat,"harga":harga satuan dalam Rupiah (angka saja)}. Untuk harga: pakai harga di label atau struk jika terbaca, kalau tidak ada perkirakan harga eceran warung di Indonesia. Jangan mengarang merek yang tidak terlihat. Jika tidak ada barang, balas [].`;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Metode tidak diizinkan" }, 405);

  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "GEMINI_API_KEY belum diisi di pengaturan Netlify" }, 500);

  let image;
  try {
    ({ image } = await req.json());
  } catch {
    return json({ error: "Permintaan tidak valid" }, 400);
  }
  if (!image) return json({ error: "Foto tidak ada" }, 400);

  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: "image/jpeg", data: image } }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return json({ error: data.error?.message || "Gagal menghubungi Gemini" }, 502);

    const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
    const m = text.match(/\[[\s\S]*\]/);
    return json({ items: m ? JSON.parse(m[0]) : [] });
  } catch (e) {
    return json({ error: "Terjadi kesalahan di server" }, 500);
  }
};
