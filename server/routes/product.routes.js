const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// GET: Fetch all products or filter by category/search query
router.get('/', async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice } = req.query;
        
        let query = supabase
            .from('products')
            .select(`
                *,
                businesses (
                    business_name,
                    category,
                    location_description,
                    is_verified
                )
            `)
            .eq('is_available', true);

        // Filter by category if provided
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Search by name or description
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
        }

        // Price range filters
        if (minPrice) query = query.gte('price', minPrice);
        if (maxPrice) query = query.lte('price', maxPrice);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            success: true,
            count: data.length,
            products: data
        });
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ success: false, error: 'Failed to retrieve marketplace products.' });
    }
});

// GET: Fetch a single product by ID with business details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                businesses (
                    id,
                    business_name,
                    category,
                    location_description,
                    logo_url,
                    is_verified
                )
            `)
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({ success: false, error: 'Product not found.' });
        }

        res.status(200).json({ success: true, product: data });
    } catch (err) {
        console.error('Error fetching product details:', err.message);
        res.status(500).json({ success: false, error: 'Server error while fetching product.' });
    }
});

module.exports = router;
