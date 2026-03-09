
const BUSINESS_PHONE = "34605980275";
const cartItemsEl = document.getElementById('cartItems');
const totalPriceEl = document.getElementById('totalPrice');
const clientNameInput = document.getElementById('clientName');
const clientPhoneInput = document.getElementById('clientPhone');
const finalizeBtn = document.getElementById('finalizeBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

let state = { selectedPack: null, extras: new Set() };

document.querySelectorAll('input[name=pack]').forEach(r=> r.addEventListener('change', e=>{ state.selectedPack = e.target.value; renderCart(); }));
document.querySelectorAll('input[type=checkbox][data-id]').forEach(ch=> ch.addEventListener('change', e=>{ const id = e.target.getAttribute('data-id'); if(e.target.checked) state.extras.add(id); else state.extras.delete(id); renderCart(); }));

function computeTotal(){ const items = []; let total=0; if(state.selectedPack){ const el = document.querySelector('input[name=pack]:checked'); if(el){ const card = el.closest('.card'); const title = card.querySelector('.title').textContent.trim(); const priceText = card.querySelector('.price').textContent.replace(' €',''); const price = parseFloat(priceText) || 0; items.push({name:title, price}); total += price; } } document.querySelectorAll('input[type=checkbox][data-id]').forEach(ch=>{ if(ch.checked){ const card = ch.closest('.card'); const title = card.querySelector('.title').textContent.trim(); const priceText = card.querySelector('.price').textContent.replace(' €',''); const price = parseFloat(priceText) || 0; items.push({name:title, price}); total += price; }}); return {total, items}; }

function renderCart(){ const res = computeTotal(); cartItemsEl.innerHTML=''; if(res.items.length===0) cartItemsEl.innerHTML='<div class="small">No hay items seleccionados.</div>'; res.items.forEach(it=>{ const div=document.createElement('div'); div.className='cart-item'; div.innerHTML=`<div>${it.name}</div><div style="font-weight:700">${it.price}€</div>`; cartItemsEl.appendChild(div); }); totalPriceEl.textContent = res.total.toFixed(2).replace('.00',''); }

// Improved minimal PDF generator placing each line separately
function makeSimplePDF(lines){ 
  // Build PDF content where each line is placed with Td to avoid overlapping
  // Start text object at y = 800 and move down by 14 units per line
  let content = 'BT /F1 12 Tf 40 800 Td\n';
  for(let i=0;i<lines.length;i++){
    const safe = lines[i].replace(/([()\\])/g,'\\$1');
    content += '(' + safe + ') Tj\n0 -14 Td\n';
  }
  content += 'ET\n';
  const header = '%PDF-1.3\n%âãÏÓ\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents 4 0 R >>\nendobj\n';
  const obj4 = '4 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\nendobj\n';
  const body = header + obj1 + obj2 + obj3 + obj4;
  const xref = 'xref\n0 5\n0000000000 65535 f \n' +
    String(header.length).padStart(10,'0') + ' 00000 n \n' +
    String(header.length+obj1.length).padStart(10,'0') + ' 00000 n \n' +
    String(header.length+obj1.length+obj2.length).padStart(10,'0') + ' 00000 n \n' +
    String(header.length+obj1.length+obj2.length+obj3.length).padStart(10,'0') + ' 00000 n \n';
  const startxref = body.length + xref.length;
  const trailer = 'trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n' + startxref + '\n%%EOF\n';
  return new Blob([body + xref + trailer], {type:'application/pdf'});
}

function buildWhatsAppLink(clientName, clientPhone, items, total){ const now=new Date(); let text=`Hola!%0AResumen%20de%20pedido%20VIP%20Car%20Wash%0AFecha:%20${encodeURIComponent(now.toLocaleString())}%0ACliente:%20${encodeURIComponent(clientName)}%0ATeléfono:%20${encodeURIComponent(clientPhone)}%0A%0A`; items.forEach(it=> text += `- ${encodeURIComponent(it.name)}: ${it.price}€%0A`); text += `%0ATotal:%20${total}€%0A%0A`; text += encodeURIComponent('He generado el PDF con el resumen (descárgalo desde el navegador).'); return `https://wa.me/${BUSINESS_PHONE}?text=${text}`; }

async function finalize(){ const clientName = clientNameInput.value.trim(); const clientPhone = clientPhoneInput.value.trim(); if(!clientName || !clientPhone){ alert('Por favor completa Nombre y Teléfono.'); return; } const res = computeTotal(); if(res.items.length===0 && !confirm('No has seleccionado ningún servicio. ¿Deseas continuar?')) return; const now=new Date(); const lines=['Resumen de Pedido VIP Car Wash','Fecha: '+now.toLocaleString(),'Cliente: '+clientName,'Teléfono: '+clientPhone,'','Ítems:']; res.items.forEach(it=> lines.push('- '+it.name+' .... '+it.price+' €')); lines.push(''); lines.push('Total: '+res.total.toFixed(2)+' €'); const blob = makeSimplePDF(lines); const filename='Resumen_Pedido_VIP_'+ new Date().toISOString().slice(0,19).replace(/:/g,'-') + '.pdf'; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); const waLink = buildWhatsAppLink(clientName, clientPhone, res.items, res.total.toFixed(2)); window.open(waLink,'_blank'); try{ await navigator.clipboard.writeText(waLink); alert('PDF descargado y enlace copiado al portapapeles.'); }catch(e){ alert('PDF descargado. Copia manualmente el enlace si hace falta.'); } }

function downloadOnly(){ const clientName = clientNameInput.value.trim() || 'Cliente'; const clientPhone = clientPhoneInput.value.trim() || '---'; const res = computeTotal(); const now=new Date(); const lines=['Resumen de Pedido VIP Car Wash','Fecha: '+now.toLocaleString(),'Cliente: '+clientName,'Teléfono: '+clientPhone,'','Ítems:']; res.items.forEach(it=> lines.push('- '+it.name+' .... '+it.price+' €')); lines.push(''); lines.push('Total: '+res.total.toFixed(2)+' €'); const blob = makeSimplePDF(lines); const filename='Resumen_Pedido_VIP_'+ new Date().toISOString().slice(0,19).replace(/:/g,'-') + '.pdf'; const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }

document.getElementById('finalizeBtn').addEventListener('click', finalize);
document.getElementById('downloadPdfBtn').addEventListener('click', downloadOnly);
renderCart();
