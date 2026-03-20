const BUSINESS_PHONE = "34605980275";
const cartItemsEl = document.getElementById('cartItems');
const totalPriceEl = document.getElementById('totalPrice');
const clientNameInput = document.getElementById('clientName');
const clientPhoneInput = document.getElementById('clientPhone');
const finalizeBtn = document.getElementById('finalizeBtn');

// Initialize state from localStorage or create an empty one
let state = JSON.parse(localStorage.getItem('vipCart')) || { pack: null, extras: {} };

// Sync HTML forms on load
function syncInputsFromState() {
    if (state.pack) {
        const packInput = document.querySelector(`input[name="pack"][value="${state.pack.id}"]`);
        if (packInput) packInput.checked = true;
    }
    for (const extraId in state.extras) {
        const extraInput = document.querySelector(`input[type="checkbox"][data-id="${extraId}"]`);
        if (extraInput) extraInput.checked = true;
    }
}

// Event Listeners for changes
document.querySelectorAll('input[name="pack"]').forEach(r => r.addEventListener('change', e => {
    const card = e.target.closest('.card');
    const title = card.querySelector('.title').textContent.trim();
    const price = parseFloat(card.querySelector('.price').textContent.replace(' €', '')) || 0;
    state.pack = { id: e.target.value, name: title, price: price };
    saveAndRender();
}));

document.querySelectorAll('input[type="checkbox"][data-id]').forEach(ch => ch.addEventListener('change', e => {
    const id = e.target.getAttribute('data-id');
    if (e.target.checked) {
        const card = e.target.closest('.card');
        const title = card.querySelector('.title').textContent.trim();
        const price = parseFloat(card.querySelector('.price').textContent.replace(' €', '')) || 0;
        state.extras[id] = { name: title, price: price };
    } else {
        delete state.extras[id];
    }
    saveAndRender();
}));

function saveAndRender() {
    localStorage.setItem('vipCart', JSON.stringify(state));
    renderCart();
}

function renderCart() {
    cartItemsEl.innerHTML = '';
    let total = 0;
    const items = [];

    if (state.pack) {
        items.push({ name: state.pack.name, price: state.pack.price });
        total += state.pack.price;
    }
    for (const extraId in state.extras) {
        const extra = state.extras[extraId];
        items.push({ name: extra.name, price: extra.price });
        total += extra.price;
    }

    if (items.length === 0) {
        cartItemsEl.innerHTML = '<div class="small">No hay items seleccionados.</div>';
    }

    items.forEach(it => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `<div>${it.name}</div><div style="font-weight:700">${it.price}€</div>`;
        cartItemsEl.appendChild(div);
    });

    totalPriceEl.textContent = total.toFixed(2).replace('.00', '');
}

function buildWhatsAppLink(clientName, clientPhone) {
    const now = new Date();
    let text = `Hola!%0AResumen%20de%20pedido%20VIP%20Car%20Wash%0AFecha:%20${encodeURIComponent(now.toLocaleString())}%0ACliente:%20${encodeURIComponent(clientName)}%0ATeléfono:%20${encodeURIComponent(clientPhone)}%0A%0A`;
    
    let total = 0;
    if (state.pack) {
        text += `- ${encodeURIComponent(state.pack.name)}: ${state.pack.price}€%0A`;
        total += state.pack.price;
    }
    for (const extraId in state.extras) {
        const extra = state.extras[extraId];
        text += `- ${encodeURIComponent(extra.name)}: ${extra.price}€%0A`;
        total += extra.price;
    }
    
    text += `%0ATotal:%20${total.toFixed(2).replace('.00','')}€%0A%0A`;
    return `https://wa.me/${BUSINESS_PHONE}?text=${text}`;
}

async function finalize() {
    const clientName = clientNameInput.value.trim();
    const clientPhone = clientPhoneInput.value.trim();
    const hasItems = state.pack !== null || Object.keys(state.extras).length > 0;

    if (!clientName || !clientPhone) {
        alert('Por favor completa Nombre y Teléfono.');
        return;
    }
    if (!hasItems && !confirm('No has seleccionado ningún servicio. ¿Deseas continuar?')) {
        return;
    }

    const waLink = buildWhatsAppLink(clientName, clientPhone);
    window.open(waLink, '_blank');
}

if (finalizeBtn) {
    finalizeBtn.addEventListener('click', finalize);
}

// Initial hydration
syncInputsFromState();
renderCart();
