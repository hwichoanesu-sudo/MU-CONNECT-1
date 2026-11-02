const API_BASE = '/api/v1';
let currentBusinessId = localStorage.getItem('muconnect_business_id') || null;

document.addEventListener('DOMContentLoaded', () => {
    setupSellerListeners();
});

function setupSellerListeners() {
    // Business Form Submission
    const bizForm = document.getElementById('businessForm');
    bizForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            business_name: document.getElementById('bizName').value,
            category: document.getElementById('bizCategory').value,
            location_description: document.getElementById('bizLocation').value,
            description: document.getElementById('bizDesc').value
        };

        try {
            const res = await fetch(`${API_BASE}/business/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                currentBusinessId = data.business.id;
                localStorage.setItem('muconnect_business_id', currentBusinessId);
                alert('Business Profile Saved Successfully! 🚀');
            } else {
                alert(data.error || 'Error saving business profile.');
            }
        } catch (err) {
            alert('Server error saving business profile.');
        }
    });

    // Product Form Submission
    const prodForm = document.getElementById('productForm');
    prodForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentBusinessId) {
            alert('Please save your Business Profile first before adding products!');
            return;
        }

        const payload = {
            business_id: currentBusinessId,
            name: document.getElementById('prodName').value,
            price: document.getElementById('prodPrice').value,
            stock_quantity: document.getElementById('prodStock').value,
            image_url: document.getElementById('prodImage').value,
            category: document.getElementById('bizCategory').value
        };

        try {
            const res = await fetch(`${API_BASE}/business/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                alert('Product Published to Campus Marketplace! 🎉');
                prodForm.reset();
            } else {
                alert(data.error || 'Error publishing product.');
            }
        } catch (err) {
            alert('Server connection error listing product.');
        }
    });
}
