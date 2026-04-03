# Teknik Bypass CORS pada Single HTML Project

Dokumentasi ini menjelaskan solusi untuk mengatasi error **CORS (Cross-Origin Resource Sharing)** yang terjadi ketika aplikasi web front-end murni (HTML + Vanilla JS) mencoba mengambil data (fetch API) dari server domain lain yang tidak memberikan izin akses silang (`Access-Control-Allow-Origin`).

CORS merupakan limitasi spesifik milik **browser web** untuk pencegahan pencurian data, bukan limitasi dari server target. Untuk mengatasi limitasi tersebut tanpa harus membuat sistem *server backend* rumit, kita menggunakan metode **Public CORS Proxy**.

## 1. CORS Proxy - `api.allorigins.win` (Rekomendasi Utama)
Server proxy ini lebih tangguh untuk membypass perlindungan layer dasar server (seperti penolakan *User Agent*). Server proxy ini akan membungkus data aslinya di dalam sebuah object ber-key `"contents"`. Oleh karena itu, kita harus melakukan "2 kali extract" (parse URL dan json response-nya).

**Contoh Kode JS:**
```javascript
async function fetchData() {
    const targetUrl = 'https://jkt48.com/api/v1/data';
    // Gunakan allorigins dengan endpoint /get
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(targetUrl);
    
    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("HTTP Error:", response.status);
        
        // 1. Ekstrak data dari AllOrigins Proxy
        const proxyJson = await response.json();
        
        // 2. Parse property "contents" yang berupa String menjadi JSON format asli
        const dataAsli = JSON.parse(proxyJson.contents);
        
        console.log("Success:", dataAsli);
    } catch (e) {
        console.error(e);
    }
}
```

## 2. CORS Proxy - `corsproxy.io` (Paling Sederhana)
Bentuk proxy yang sangat standar. Anda cukup menambahkan URL `https://corsproxy.io/?` di depan URL Target Anda, dan proxy ini akan mereturn response API secara utuh tanpa membungkus datanya lagi ke properti apa-apa.

**Contoh Kode JS:**
```javascript
const targetUrl = 'https://jkt48.com/api/v1/data';
const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(targetUrl);

fetch(proxyUrl)
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(e => console.error(e));
```
*(Catatan: Layanan ini kadang sering menerima error `403 Forbidden` dari API target yang memakai perlindungan Cloudflare atau anti-bot karena layanan public ini banyak digunakan secara abusive).*

---

## Tips Tambahan: Apabila Semua Proxy Publik Gagal
Jika URL API target kamu memblokir semua alamat IP public proxy, maka tidak ada cara bagi client-side (HTML murni) menembusnya. Jika hal itu terjadi:
1. **Buat Server Backend Sederhana:** (Contohnya dengan library `Requests` di Python/Streamlit, atau Express.js/Node.js). Server backend dapat mengirim HTTP Request tanpa terblokir aturan web browser, dan bisa mengatur `User-Agent` dengan leluasa (bahkan membajak User-Agent Windows Desktop) sehingga 100% aman block.
2. **Deploy lewat Serverless Edge (seperti Vercel atau Cloudflare Workers):** Untuk men-fetch API secara aman dan mereturn datanya langsung ke website.
