const MODELS = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

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

  const body = JSON.stringify({
    contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: "image/jpeg", data: image } }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  let lastMsg = "";

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        { method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": key }, body }
      );
      const data = await r.json();

      if (r.ok) {
        const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
        const m = text.match(/\[[\s\S]*\]/);
        return json({ items: m ? JSON.parse(m[0]) : [], model });
      }

      lastMsg = `[${model}] ${data.error?.message || r.status}`;

      // Kunci salah atau tidak punya izin: model lain pun akan gagal, hentikan.
      if (r.status === 400 || r.status === 401 || r.status === 403) {
        return json({ error: lastMsg }, 502);
      }
      // Sibuk (429/503), tidak ditemukan (404), atau error server: coba model berikutnya.
    } catch (e) {
      lastMsg = `[${model}] ${e.message}`;
    }
  }

  return json({ error: "Semua model sedang sibuk. Tunggu sebentar lalu coba lagi. " + lastMsg }, 503);
};
