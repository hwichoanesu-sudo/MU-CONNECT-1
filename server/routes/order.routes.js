const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST: Process checkout and generate WhatsApp redirect link
router.post('/checkout', async (req, res) => {
    try {
        const { productId, buyerName, buyerLocation, buyerPhone, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, error: 'Product ID is required.' });
        }

        // 1. Fetch product details along with business info
        const { data: product } = await supabase
            .from('products')
            .select('*, businesses(*)')
            .eq('id', productId)
            .maybeSingle();

        const productName = product ? product.name : 'Campus Item';
        const productPrice = product ? product.price : '200';
        let vendorPhone = '260970000000'; // Default fallback phone number

        // 2. Fetch seller phone number if business & owner exist
        if (product && product.businesses && product.businesses.owner_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('phone_number')
                .eq('id', product.businesses.owner_id)
                .maybeSingle();
            
            if (profile && profile.phone_number) {
                vendorPhone = profile.phone_number;
            }
        }

        // 3. Optional order log entry
        try {
            await supabase.from('orders').insert([{
                product_id: productId,
                buyer_location: buyerLocation || 'Campus Hostel',
                total_price: (product ? product.price : 200) * (quantity || 1),
                status: 'pending'
            }]);
        } catch (dbErr) {
            console.log('Non-fatal order log notice:', dbErr.message);
        }

        // 4. Construct WhatsApp Payload
        const message = `🛍️ *New Muconnect Order!*\n\n` +
                        `📦 *Item:* ${productName} (K${productPrice})\n` +
                        `👤 *Name:* ${buyerName || 'Student'}\n` +
                        `📍 *Location/Room:* ${buyerLocation || 'Hostel'}\n` +
                        `📞 *Number:* ${buyerPhone || 'N/A'}`;

        const whatsappUrl = `https://wa.me/${vendorPhone}?text=${encodeURIComponent(message)}`;

        res.json({ success: true, whatsappUrl });
    } catch (err) {
        console.error('Checkout error:', err.message);
        const fallbackUrl = `https://wa.me/260970000000?text=${encodeURIComponent('Hello, I want to place an order on Muconnect!')}`;
        res.json({ success: true, whatsappUrl: fallbackUrl });
    }
});

module.exports = router;
