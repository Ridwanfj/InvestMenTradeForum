// Vercel Serverless Function - Spreadsheet ID tersembunyi di environment variables
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Cache headers - cache selama 5 menit, stale-while-revalidate selama 10 menit
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Ambil dari Environment Variables (aman, tidak terlihat di client)
    const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
    const SPREADSHEET_GAMBAR_ID = process.env.SPREADSHEET_GAMBAR_ID;
    const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';
    const SHEET_GAMBAR_NAME = process.env.SHEET_GAMBAR_NAME || 'Sheet1';

    // Debug: Log environment variables (akan muncul di Vercel logs)
    console.log('SPREADSHEET_ID exists:', !!SPREADSHEET_ID);
    console.log('SPREADSHEET_GAMBAR_ID exists:', !!SPREADSHEET_GAMBAR_ID);

    if (!SPREADSHEET_ID || !SPREADSHEET_GAMBAR_ID) {
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
            message: 'Spreadsheet IDs not configured. Please check Vercel Environment Variables.'
        });
    }

    const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const SHEET_GAMBAR_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_GAMBAR_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_GAMBAR_NAME)}`;

    try {
        // Fetch data dari kedua sheet
        const [responseData, responseGambar] = await Promise.all([
            fetch(SHEET_URL),
            fetch(SHEET_GAMBAR_URL)
        ]);

        if (!responseData.ok) {
            throw new Error(`Failed to fetch main spreadsheet: ${responseData.status}`);
        }
        if (!responseGambar.ok) {
            throw new Error(`Failed to fetch gambar spreadsheet: ${responseGambar.status}`);
        }

        const textData = await responseData.text();
        const textGambar = await responseGambar.text();

        // Parse Google Sheets JSON response (format: /*O_o*/google.visualization.Query.setResponse({...});)
        let jsonData, jsonGambar;

        try {
            // Remove prefix "/*O_o*/\ngoogle.visualization.Query.setResponse(" and suffix ");"
            const cleanData = textData.replace(/^[\s\S]*?google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');
            const cleanGambar = textGambar.replace(/^[\s\S]*?google\.visualization\.Query\.setResponse\(/, '').replace(/\);?\s*$/, '');

            jsonData = JSON.parse(cleanData);
            jsonGambar = JSON.parse(cleanGambar);
        } catch (parseError) {
            // Fallback: try original parsing method
            jsonData = JSON.parse(textData.substring(47).slice(0, -2));
            jsonGambar = JSON.parse(textGambar.substring(47).slice(0, -2));
        }

        // Return combined data
        return res.status(200).json({
            success: true,
            data: jsonData,
            gambar: jsonGambar
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch data',
            message: error.message
        });
    }
}
