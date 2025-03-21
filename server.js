const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Ensure uploads and data directories exist
const uploadDir = path.join(__dirname, 'uploads');
const dataFile = path.join(__dirname, 'verified_titles.json');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

// Multer setup for file uploads
const upload = multer({ dest: uploadDir });

app.use(cors());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public directory

// Endpoint to upload file and check for title
app.post('/upload-file', upload.single('titleFile'), (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const filePath = path.join(uploadDir, req.file.filename);
    const userTitle = req.body.userTitle ? req.body.userTitle.trim().toLowerCase() : '';

    if (!userTitle) {
        fs.unlinkSync(filePath);
        return res.status(400).json({ message: 'Title cannot be empty.' });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        fs.unlinkSync(filePath); // Delete uploaded file

        if (err) return res.status(500).json({ message: 'Error reading the file.' });

        // Normalize titles and check for duplicates
        const titlesInFile = data.split('\n').map(title => title.trim().toLowerCase()).filter(title => title.length > 0);
        const isDuplicate = titlesInFile.includes(userTitle);

        // Save result permanently with timestamp
        let verifiedTitles = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        verifiedTitles.push({ 
            title: userTitle, 
            duplicate: isDuplicate,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(dataFile, JSON.stringify(verifiedTitles, null, 2));

        return res.json({ duplicate: isDuplicate, saved: true });
    });
});

// Endpoint to fetch all verified titles
app.get('/verified-titles', (req, res) => {
    const verifiedTitles = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    res.json(verifiedTitles);
});

// Endpoint to clear all verified titles
app.post('/clear-titles', (req, res) => {
    try {
        // Check if file exists
        if (!fs.existsSync(dataFile)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Data file not found' 
            });
        }

        // Read the current file first to ensure it exists and is valid JSON
        let currentData;
        try {
            const fileContent = fs.readFileSync(dataFile, 'utf8');
            currentData = JSON.parse(fileContent);
        } catch (error) {
            console.error('Error reading data file:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error reading data file: ' + error.message 
            });
        }
        
        // Write empty array to the file
        try {
            fs.writeFileSync(dataFile, JSON.stringify([], null, 2));
        } catch (error) {
            console.error('Error writing to data file:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Error writing to data file: ' + error.message 
            });
        }
        
        res.json({ 
            success: true, 
            message: 'All titles cleared successfully',
            clearedCount: currentData.length
        });
    } catch (error) {
        console.error('Error clearing titles:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error clearing titles: ' + error.message 
        });
    }
});

// Start the server
app.listen(port, () => console.log(`✅ Server running on http://localhost:${port}`));
