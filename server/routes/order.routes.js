const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// Set your platform admin WhatsApp number here to receive order copies
const ADMIN_WHATSAPP = '260970000000'; // Replace with your actual admin number

router.post('/checkout', async (req, res) => {
    try {
        const { productId, buyerName, buyerWhatsapp, quantity } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, error: 'Product ID is required.' });
        }

        // 1. Fetch product and associated business info
        const { data: product } = await supabase
            .from('products')
            .select('*, businesses(*)')
            .eq('id', productId)
            .maybeSingle();

        const productName = product ? product.name : 'Campus Item';
        const productPrice = product ? product.price : 0;
        const businessName = product && product.businesses ? product.businesses.business_name : 'Muconnect Vendor';
        let vendorPhone = '260970000000';

        // 2. Fetch vendor's registered phone number
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

        const qty = parseInt(quantity) || 1;
        const totalPrice = productPrice * qty;

        // 3. Format the order message matching Poultry Prime style
        const message = `🛍️ *New Order from Muconnect!*\n\n` +
                        `🏢 *Business:* ${businessName}\n` +
                        `📦 *Item:* ${productName}\n` +
                        `🔢 *Quantity:* ${qty}\n` +
                        `💰 *Total Price:* K${totalPrice}\n\n` +
                        `👤 *Customer Name:* ${buyerName || 'Student'}\n` +
                        `📞 *Customer WhatsApp:* ${buyerWhatsapp || 'N/A'}`;

        // 4. Generate WhatsApp URL pointing to the vendor
        const whatsappUrl = `https://wa.me/${vendorPhone}?text=${encodeURIComponent(message)}`;

        // Optional: Log order in Supabase database
        try {
            await supabase.from('orders').insert([{
                product_id: productId,
                buyer_location: buyerWhatsapp,
                total_price: totalPrice,
                status: 'pending'
            }]);
        } catch (dbErr) {
            console.log('Order log note:', dbErr.message);
        }

        res.json({ 
            success: true, 
            whatsappUrl,
            adminNoticeUrl: `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent('📋 *Admin Copy:*\n' + message)}`
        });
    } catch (err) {
        console.error('Checkout error:', err.message);
        res.status(500).json({ success: false, error: 'Server error processing checkout.' });
    }
});

module.exports = router;
