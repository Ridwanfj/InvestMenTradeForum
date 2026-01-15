// Vercel Serverless Function - Peminatan Form Submission
// Google Apps Script URL tersembunyi di environment variables
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST method
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed',
            message: 'Only POST requests are allowed'
        });
    }

    // Ambil dari Environment Variables (aman, tidak terlihat di client)
    const SCRIPT_URL = process.env.PEMINATAN_SCRIPT_URL;

    // Debug: Log environment variables (akan muncul di Vercel logs)
    console.log('PEMINATAN_SCRIPT_URL exists:', !!SCRIPT_URL);

    if (!SCRIPT_URL) {
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
            message: 'Peminatan Script URL not configured. Please check Vercel Environment Variables.'
        });
    }

    try {
        // Get form data from request body
        const formData = req.body;

        // Validate required fields
        if (!formData || !formData.nama_perusahaan) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                message: 'Data form tidak lengkap'
            });
        }

        // Forward request to Google Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });


        return res.status(200).json({
            success: true,
            message: 'Data berhasil dikirim'
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to submit data',
            message: error.message
        });
    }
}
