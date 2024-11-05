const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins
app.use(cors({
    origin: '*',  // Allow requests from any origin
    methods: ['GET', 'POST'], // Specify allowed methods
    allowedHeaders: ['Content-Type'] // Specify allowed headers
}));
app.use(express.json({ limit: '50mb' }));

app.post('/generate-pdf', async (req, res) => {
    let browser;
    try {
        const { htmlContent } = req.body;

        // Launch browser with additional configurations for Vercel
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-gpu',
                '--disable-dev-shm-usage'
            ]
        });

        const page = await browser.newPage();

        // Set content with styles
        await page.setContent(htmlContent, {
            waitUntil: ['networkidle0', 'load', 'domcontentloaded']
        });

        // Ensure content is fully loaded
        await page.evaluate(() => new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                window.addEventListener('load', resolve);
            }
        }));

        // Generate PDF
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        // Set proper headers and send as binary
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length,
            'Content-Disposition': 'attachment; filename=document.pdf'
        });
        
        // Send the PDF buffer directly without using .send()
        res.end(pdf);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});