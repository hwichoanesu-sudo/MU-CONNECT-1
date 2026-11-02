const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// POST: Place a new order and generate WhatsApp checkout payload
router.post('/', async (req, res) => {
    try {
        const { buyer_id, business_id, items, delivery_details } = req.body;

        if (!buyer_id || !business_id || !items || items.length === 0) {
            return res.status(400).json({ success: false, error: 'Missing required order details.' });
        }

        // 1. Fetch current product prices and stock from database (Never trust client prices!)
        const productIds = items.map(item => item.product_id);
        const { data: dbProducts, error: prodError } = await supabase
            .from('products')
            .select('id, name, price, stock_quantity, business_id')
            .in('id', productIds);

        if (prodError || !dbProducts) {
            return res.status(400).json({ success: false, error: 'Failed to validate products in order.' });
        }

        // 2. Calculate totals server-side
        let calculatedTotal = 0;
        const orderItemsToInsert = [];

        for (const item of items) {
            const dbProduct = dbProducts.find(p => p.id === item.product_id);
            
            if (!dbProduct) {
                return res.status(400).json({ success: false, error: `Product ID ${item.product_id} not found.` });
            }
            if (dbProduct.business_id !== business_id) {
                return res.status(400).json({ success: false, error: 'All items in an order must belong to the same business.' });
            }
            if (dbProduct.stock_quantity < item.quantity) {
                return res.status(400).json({ success: false, error: `Insufficient stock for ${dbProduct.name}.` });
            }

            const itemTotal = dbProduct.price * item.quantity;
            calculatedTotal += itemTotal;

            orderItemsToInsert.push({
                product_id: dbProduct.id,
                quantity: item.quantity,
                unit_price: dbProduct.price
            });
        }

        // 3. Calculate Platform Commission (e.g., 5% commission model)
        const commissionRate = 5.00; // 5 percent
        const commissionAmount = (calculatedTotal * (commissionRate / 100)).toFixed(2);

        // 4. Insert Order into Supabase
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert([{
                buyer_id,
                business_id,
                total_amount: calculatedTotal,
                commission_amount: commissionAmount,
                status: 'pending',
                delivery_details: delivery_details || 'Campus Pickup'
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        const orderId = orderData.id;

        // 5. Insert Order Items linked to the Order ID
        const itemsWithOrderId = orderItemsToInsert.map(item => ({
            ...item,
            order_id: orderId
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(itemsWithOrderId);

        if (itemsError) throw itemsError;

        // 6. Record Commission Ledger Entry
        await supabase
            .from('commission_records')
            .insert([{
                order_id: orderId,
                business_id: business_id,
                gross_amount: calculatedTotal,
                commission_rate: commissionRate,
                commission_due: commissionAmount,
                payout_status: 'unpaid'
            }]);

        // 7. Fetch business owner or contact phone number for WhatsApp redirection
        const { data: businessData } = await supabase
            .from('businesses')
            .select('business_name, profiles(phone_number)')
            .eq('id', business_id)
            .single();

        const vendorPhone = businessData?.profiles?.phone_number || '';

        // Format a clean WhatsApp checkout message string
        const itemSummaryText = items.map(i => {
            const p = dbProducts.find(prod => prod.id === i.product_id);
            return `- ${i.quantity}x ${p.name} (K${p.price * i.quantity})`;
        }).join('%0A');

        const whatsappMessage = `*New Order via Muconnect!*%0A%0A*Order ID:* ${orderId.slice(0, 8)}%0A*Delivery Details:* ${encodeURIComponent(delivery_details)}%0A%0A*Items:*%0A${itemSummaryText}%0A%0A*Total Amount:* K${calculatedTotal}%0A%0APlease confirm this order!`;

        const whatsappLink = `https://wa.me/${vendorPhone}?text=${whatsappMessage}`;

        res.status(201).json({
            success: true,
            message: 'Order placed successfully and recorded in ledger.',
            order: orderData,
            whatsapp_link: whatsappLink
        });

    } catch (err) {
        console.error('Checkout error:', err.message);
        res.status(500).json({ success: false, error: 'Server error processing checkout.' });
    }
});

module.exports = router;
