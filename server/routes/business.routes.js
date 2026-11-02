const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST: Create or update business profile
router.post('/register', async (req, res) => {
    try {
        const { owner_id, business_name, description, category, location_description } = req.body;

        if (!business_name || !category) {
            return res.status(400).json({ success: false, error: 'Business name and category are required.' });
        }

        const { data, error } = await supabase
            .from('businesses')
            .upsert([{
                owner_id: owner_id || '00000000-0000-0000-0000-000000000000', // Demo owner ID until full Auth session bind
                business_name,
                description,
                category,
                location_description
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, business: data });
    } catch (err) {
        console.error('Error saving business profile:', err.message);
        res.status(500).json({ success: false, error: 'Failed to create business storefront.' });
    }
});

// POST: Add new product listing for a business
router.post('/products', async (req, res) => {
    try {
        const { business_id, name, description, price, stock_quantity, category, image_url } = req.body;

        if (!name || !price || !business_id) {
            return res.status(400).json({ success: false, error: 'Missing product details.' });
        }

        const { data, error } = await supabase
            .from('products')
            .insert([{
                business_id,
                name,
                description: description || '',
                price: parseFloat(price),
                stock_quantity: parseInt(stock_quantity) || 1,
                category: category || 'General',
                image_url: image_url || '',
                is_available: true
            }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, product: data });
    } catch (err) {
        console.error('Error listing product:', err.message);
        res.status(500).json({ success: false, error: 'Failed to publish product.' });
    }
});

module.exports = router;
