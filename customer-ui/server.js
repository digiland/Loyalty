const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the customer-ui directory
app.use(express.static(path.join(__dirname)));

// Handle all routes by serving the index.html file
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Customer UI server running at http://localhost:${port}`);
    console.log('Make sure your FastAPI backend is running on http://localhost:8000');
});
