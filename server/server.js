require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================
// SECURITY & UTILITY MIDDLEWARE
// =========================================
app.use(helmet({
    contentSecurityPolicy: false // Allows inline scripts & fonts during dev/demo
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// =========================================
// HEALTH & BASE API CHECK
// =========================================
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        service: 'Muconnect API',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/v1', (req, res) => {
    res.json({ message: 'Welcome to the Muconnect API Core 🚀' });
});

// =========================================
// API ROUTE MOUNTING
// =========================================
const productRoutes = require('./routes/product.routes');
const orderRoutes = require('./routes/order.routes');
const aiRoutes = require('./routes/ai.routes');
const businessRoutes = require('./routes/business.routes');

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/business', businessRoutes);

// =========================================
// FRONTEND CATCH-ALL (SINGLE PAGE APPLICATION ROUTING)
// =========================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// =========================================
// GLOBAL ERROR HANDLER
// =========================================
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        error: 'Internal Server Error', 
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Muconnect server running on port ${PORT}`);
});
