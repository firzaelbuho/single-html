export default async function handler(req, res) {
  // Aktifkan CORS (agar tetap bisa dites di localhost:5500 tanpa error)
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle preflight request (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { event } = req.query;
  
  const urls = {
    '2shoot': 'https://jkt48.com/api/v1/exclusives/EX579E/bonus?lang=id',
    'mng': 'https://jkt48.com/api/v1/exclusives/EXE588/bonus?lang=id'
  };

  const targetUrl = urls[event];

  if (!targetUrl) {
    return res.status(400).json({ status: false, message: "Parameter event tidak valid." });
  }

  try {
    // Memanipulasi User-Agent untuk bypass firewall JKT48 (sama seperti logic Python script)
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error dari JKT48: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: false, message: error.message });
  }
}
