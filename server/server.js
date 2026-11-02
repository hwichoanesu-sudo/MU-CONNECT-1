require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Health Check Endpoint (Required for Render)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'Muconnect API',
        timestamp: new Date().toISOString()
    });
});

// Base API route placeholder
app.get('/api/v1', (req, res) => {
    res.json({ message: 'Welcome to the Muconnect API Core 🚀' });
});

// Global Error Handler
app.err((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`Muconnect server running on port ${PORT}`);
});
