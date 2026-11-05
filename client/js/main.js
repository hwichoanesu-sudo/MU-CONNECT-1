let selectedProductId = null;

// When user clicks "Order on WhatsApp" on a product card
function openCheckoutModal(productId) {
    selectedProductId = productId;
    document.getElementById('checkout-modal').style.display = 'flex';
}

// Close modal handlers
document.getElementById('close-modal-btn').onclick = () => {
    document.getElementById('checkout-modal').style.display = 'none';
};

// When user clicks the "WhatsApp Button" inside the modal
document.getElementById('submit-order-btn').onclick = async () => {
    const buyerName = document.getElementById('buyer-name').value.trim();
    const buyerLocation = document.getElementById('buyer-location').value.trim();
    const buyerPhone = document.getElementById('buyer-phone').value.trim();

    if (!buyerName || !buyerLocation || !buyerPhone) {
        alert('Please fill in all fields before proceeding.');
        return;
    }

    try {
        const response = await fetch('/api/v1/orders/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                productId: selectedProductId, 
                buyerName, 
                buyerLocation, 
                buyerPhone,
                quantity: 1 
            })
        });

        const data = await response.json();

        if (data.success && data.whatsappUrl) {
            document.getElementById('checkout-modal').style.display = 'none';
            window.open(data.whatsappUrl, '_blank');
        } else {
            alert(data.error || 'Failed to process checkout.');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        alert('Server error processing checkout.');
    }
};
