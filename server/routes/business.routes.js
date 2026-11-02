const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const crypto = require('crypto');

// POST: Create or update business profile
router.post('/register', async (req, res) => {
    try {
        const { business_name, description, category, location_description } = req.body;

        if (!business_name || !category) {
            return res.status(400).json({ success: false, error: 'Business name and category are required.' });
        }

        // Use a consistent demo owner ID or generate one
        const demoOwnerId = '11111111-1111-1111-1111-111111111111';

        // 1. Force insert/upsert the profile using service role (bypasses RLS)
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert([
                { id: demoOwnerId, full_name: 'Campus Vendor', role: 'seller', phone_number: '260900000000' }
            ], { onConflict: 'id' });

        if (profileError) {
            console.error('Profile Upsert Warning:', profileError.message);
        }

        // 2. Check if business exists for this owner
        const { data: existingBiz } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', demoOwnerId)
            .maybeSingle();

        let data, error;

        if (existingBiz) {
            // Update existing business
            const updateRes = await supabase
                .from('businesses')
                .update({
                    business_name,
                    description: description || '',
                    category,
                    location_description: location_description || 'Campus'
                })
                .eq('id', existingBiz.id)
                .select()
                .single();
            
            data = updateRes.data;
            error = updateRes.error;
        } else {
            // Insert new business
            const insertRes = await supabase
                .from('businesses')
                .insert([{
                    owner_id: demoOwnerId,
                    business_name,
                    description: description || '',
                    category,
                    location_description: location_description || 'Campus'
                }])
                .select()
                .single();
            
            data = insertRes.data;
            error = insertRes.error;
        }

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
