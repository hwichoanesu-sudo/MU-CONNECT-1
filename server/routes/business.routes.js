const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST: Create or update business profile
router.post('/register', async (req, res) => {
    try {
        const { business_name, description, category, location_description } = req.body;

        if (!business_name || !category) {
            return res.status(400).json({ success: false, error: 'Business name and category are required.' });
        }

        const demoOwnerId = '00000000-0000-0000-0000-000000000000';

        // Ensure a dummy/demo profile exists to satisfy foreign key constraints
        await supabase
            .from('profiles')
            .upsert([{ id: demoOwnerId, full_name: 'Campus Vendor', role: 'seller' }]);

        const { data, error } = await supabase
            .from('businesses')
            .upsert([{
                owner_id: demoOwnerId,
                business_name,
                description,
                category,
                location_description
            }], { onConflict: 'owner_id' })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ success: true, business: data });
    } catch (err) {
        console.error('Error saving business profile:', err.message);
        res.status(500).json({ success: false, error: err.message || 'Failed to create business storefront.' });
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
        res.status(500).json({ success: false, error: err.message || 'Failed to publish product.' });
    }
});

module.exports = router;
