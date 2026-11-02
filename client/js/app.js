const API_BASE = '/api/v1';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
});

// Fetch & Display Products
async function fetchProducts(category = 'all', search = '') {
    const grid = document.getElementById('productGrid');
    const countBadge = document.getElementById('productCount');
    
    try {
        let url = `${API_BASE}/products?`;
        if (category !== 'all') url += `category=${encodeURIComponent(category)}&`;
        if (search) url += `search=${encodeURIComponent(search)}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!data.success || !data.products.length) {
            grid.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1;">No listings found. Be the first student vendor to post!</p>`;
            countBadge.textContent = '0 items';
            return;
        }

        countBadge.textContent = `${data.products.length} items`;
        grid.innerHTML = data.products.map(p => `
            <div class="product-card">
                <div>
                    <img src="${p.image_url || 'https://via.placeholder.com/300x200?text=Muconnect'}" alt="${p.name}">
                    <div class="product-title">${p.name}</div>
                    <div class="product-vendor">By ${p.businesses?.business_name || 'Student Business'} • 📍 ${p.businesses?.location_description || 'Campus'}</div>
                </div>
                <div>
                    <div class="product-price">K${p.price}</div>
                    <button class="btn-primary" style="width: 100%; margin-top: 0.8rem;" onclick="buyNow('${p.id}', '${p.business_id}')">Order on WhatsApp</button>
                </div>
            </div>
        `).join('');

    } catch (err) {
        grid.innerHTML = `<p style="color: #ef4444; grid-column: 1/-1;">Error connecting to marketplace API.</p>`;
    }
}

// Order Trigger
async function buyNow(productId, businessId) {
    const delivery = prompt('Enter your campus location / Hostel & Room Number:');
    if (!delivery) return;

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buyer_id: '00000000-0000-0000-0000-000000000000', // Guest/Demo buyer placeholder until auth session
                business_id: businessId,
                items: [{ product_id: productId, quantity: 1 }],
                delivery_details: delivery
            })
        });

        const data = await res.json();
        if (data.success && data.whatsapp_link) {
            window.open(data.whatsapp_link, '_blank');
        } else {
            alert(data.error || 'Failed to generate order payload.');
        }
    } catch (err) {
        alert('Server connection error while completing order.');
    }
}

// Event Listeners & AI Widget Handler
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    document.getElementById('searchBtn').addEventListener('click', () => {
        fetchProducts('all', searchInput.value);
    });

    // Categories
    document.querySelectorAll('.cat-card').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-card').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            fetchProducts(e.target.dataset.cat, searchInput.value);
        });
    });

    // AI Widget Toggle
    const aiWidget = document.getElementById('aiWidget');
    document.getElementById('aiToggleBtn').addEventListener('click', () => aiWidget.classList.remove('hidden'));
    document.getElementById('aiCloseBtn').addEventListener('click', () => aiWidget.classList.add('hidden'));

    // AI Chat Send
    document.getElementById('aiSendBtn').addEventListener('click', sendAiMessage);
}

async function sendAiMessage() {
    const input = document.getElementById('aiInput');
    const chatBox = document.getElementById('aiChatBox');
    const msg = input.value.trim();
    if (!msg) return;

    chatBox.innerHTML += `<div class="ai-msg user">${msg}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch(`${API_BASE}/ai/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_query: msg })
        });
        const data = await res.json();
        const responseText = data.response || 'Sorry, I could not retrieve an answer right now.';
        chatBox.innerHTML += `<div class="ai-msg bot">${responseText}</div>`;
    } catch (err) {
        chatBox.innerHTML += `<div class="ai-msg bot">Connection error. Please try again!</div>`;
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}
