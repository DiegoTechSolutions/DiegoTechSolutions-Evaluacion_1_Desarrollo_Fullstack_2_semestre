// 1) Utilidad: leo el carrito guardado o creo uno vacío
function getCart(){
  const raw = localStorage.getItem('cart');
  return raw ? JSON.parse(raw) : [];       // arreglo de items {id, name, price, qty}
}

// 2) Guardo el carrito (arreglo) en localStorage
function saveCart(cart){
  localStorage.setItem('cart', JSON.stringify(cart));
}

// 3) Actualizo el texto "Cart (n)" del header
function updateCartCounter(){
  const span = document.querySelector('.carrito span'); // <span>Cart (0)</span>
  if(!span) return;

  const cart = getCart();
  // sumo todas las cantidades
  const total = cart.reduce((acc, item) => acc + item.qty, 0);
  span.textContent = `Cart (${total})`;
}

// 4) Agregar un producto simple al carrito
function addToCart({ id, name, price }){
  const cart = getCart();

  // ¿ya existe ese producto? -> aumento qty
  const found = cart.find(p => p.id === id);
  if(found){
    found.qty += 1;
  }else{
    cart.push({ id, name, price, qty: 1 });
  }

  saveCart(cart);
  updateCartCounter();
  alert(`${name} añadido al carrito ✅`);
}

// 5) Enlazo clicks a los botones .btn-add que tengan data atributos
function setupAddButtons(){
  // Ejemplo de botón:
  // <button class="btn btn-negro btn-add" data-id="P001" data-name="Mouse" data-price="15990">Añadir</button>
  const buttons = document.querySelectorAll('.btn-add');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = Number(btn.dataset.price || 0); // precio en número

      if(!id || !name){
        console.warn('Faltan data-id o data-name en el botón .btn-add');
        return;
      }

      addToCart({ id, name, price });
    });
  });
}

// 6) Al cargar la página, dejo todo listo
document.addEventListener('DOMContentLoaded', () => {
  updateCartCounter();
  setupAddButtons();
});


/* =========================================================
   Esto es para CARRITO - PÁGINA carrito.html
   - Renderiza filas
   - Cambia cantidades (+ / -)
   - Elimina item
   - Vacía todo
   - Calcula total con formato CLP
========================================================= */

// formateo sencillo a CLP
function formatCLP(n){
  try{
    return new Intl.NumberFormat('es-CL', { style:'currency', currency:'CLP', maximumFractionDigits:0 }).format(n);
  }catch(e){
    // fallback simple
    return '$' + (Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'));
  }
}

// subtotal del carrito
function cartTotal(cart){
  return cart.reduce((acc, it) => acc + (it.price * it.qty), 0);
}

// cambia la cantidad de un ítem (delta = +1 / -1)
function changeQty(id, delta){
  const cart = getCart();
  const it = cart.find(p => p.id === id);
  if(!it) return;
  it.qty += delta;
  if(it.qty <= 0){
    // si llega a 0 o menos, lo saco
    const idx = cart.findIndex(p => p.id === id);
    cart.splice(idx, 1);
  }
  saveCart(cart);
  updateCartCounter();
  renderCart(); // refresco la vista si estoy en carrito.html
}

// elimina un ítem por completo
function removeFromCart(id){
  const cart = getCart().filter(p => p.id !== id);
  saveCart(cart);
  updateCartCounter();
  renderCart();
}

// vacía todo
function clearCart(){
  saveCart([]);
  updateCartCounter();
  renderCart();
  alert('Carrito vacío 🗑️');
}

// render principal (solo corre si existe #cart-body)
function renderCart(){
  const body = document.getElementById('cart-body');
  const empty = document.getElementById('cart-empty');
  const table = document.getElementById('cart-table');
  const totalEl = document.getElementById('cart-total');

  if(!body || !empty || !table || !totalEl) return; // no estoy en carrito.html

  const cart = getCart();

  // si está vacío, muestro mensaje y oculto tabla
  if(cart.length === 0){
    empty.style.display = 'block';
    table.style.display = 'none';
    totalEl.textContent = '$0';
    return;
  }

  empty.style.display = 'none';
  table.style.display = 'block';

  // dibujo filas
  body.innerHTML = cart.map(it => {
    const subtotal = it.price * it.qty;
    return `
      <div class="t-row">
        <span>${it.name}</span>
        <span>${formatCLP(it.price)}</span>
        <span class="cart-qty">
          <button class="btn btn-secundario btn-sm" data-action="minus" data-id="${it.id}">-</button>
          <strong>${it.qty}</strong>
          <button class="btn btn-secundario btn-sm" data-action="plus" data-id="${it.id}">+</button>
        </span>
        <span>${formatCLP(subtotal)}</span>
        <span class="cart-actions">
          <button class="btn btn-negro btn-sm" data-action="remove" data-id="${it.id}">Eliminar</button>
        </span>
      </div>
    `;
  }).join('');

  // total
  totalEl.textContent = formatCLP(cartTotal(cart));

  // listeners para +/-/eliminar (delegación simple)
  body.querySelectorAll('button[data-action]').forEach(btn => {
    const id = btn.dataset.id;
    const action = btn.dataset.action;
    btn.addEventListener('click', () => {
      if(action === 'plus') changeQty(id, +1);
      if(action === 'minus') changeQty(id, -1);
      if(action === 'remove') removeFromCart(id);
    });
  });

  // botones globales
  const clearBtn = document.getElementById('cart-clear');
  const checkoutBtn = document.getElementById('cart-checkout');
  if(clearBtn) clearBtn.onclick = clearCart;
  if(checkoutBtn) checkoutBtn.onclick = () => {
    alert('Demo: aquí iría el proceso de pago / confirmación 😄');
  };
}

// si estoy en carrito.html, pinto al cargar
document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('cart-body')){
    renderCart();
  }
});


/* =========================================================
   VALIDACIONES DE FORMULARIOS (nivel alumno)
   - Contacto: nombre, correo (gmail/duoc), comentario <= 500
   - Login: correo (gmail/duoc), contraseña 4 a 10
   - Registro: RUN sin puntos ni guion (7-9), nombre, apellidos,
               correo (gmail/duoc), dirección
   - Todo simple, con mensajes bajo cada campo
========================================================= */

// --- Helpers simples---
function byId(id){ return document.getElementById(id); }

function clearErrors(form){
  form.querySelectorAll('.error-msg').forEach(e => e.remove());
  form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
}

function showError(inputEl, msg){
  inputEl.classList.add('invalid');
  const p = document.createElement('p');
  p.className = 'error-msg';
  p.textContent = msg;
  inputEl.insertAdjacentElement('afterend', p);
}

function isEmpty(v){ return !v || v.trim() === ''; }

// correo válido solo @gmail.com o @duoc.cl
function isAllowedEmail(email){
  const re = /^[\w.-]+@(gmail\.com|duoc\.cl)$/i;
  return re.test(email.trim());
}

// contraseña entre 4 y 10 caracteres
function isValidPass(pass){
  return typeof pass === 'string' && pass.length >= 4 && pass.length <= 10;
}

// RUN simple: sin puntos ni guion, largo 7 a 9, solo dígitos y/o K
// (OPCIONAL: más abajo te dejo una función para validar DV si la quieres usar)
function isValidRUNSimple(run){
  if(!run) return false;
  const v = run.trim().toUpperCase();
  if(!/^[0-9K]+$/.test(v)) return false;
  return v.length >= 7 && v.length <= 9;
}

/* // OPCIONAL (bonus): validar dígito verificador chileno
function isValidRUNWithDV(run){
  if(!run) return false;
  const v = run.trim().toUpperCase();
  if(!/^[0-9K]+$/.test(v) || v.length < 7 || v.length > 9) return false;
  // separar cuerpo y DV (último char)
  const dv = v.slice(-1);
  const cuerpo = v.slice(0, -1);
  let suma = 0, mul = 2;
  for(let i = cuerpo.length - 1; i >= 0; i--){
    suma += parseInt(cuerpo[i], 10) * mul;
    mul = (mul === 7) ? 2 : mul + 1;
  }
  const res = 11 - (suma % 11);
  const dvCalc = (res === 11) ? '0' : (res === 10 ? 'K' : String(res));
  return dvCalc === dv;
}
*/

// buscar el <form> usando un input id clave (evito confundir con el form del footer)
function getFormByInputId(inputId){
  const el = byId(inputId);
  return el ? el.closest('form') : null;
}

// =========================================================
// CONTACTO (contacto.html)
// IDs: c-nombre, c-correo, c-comentario
// =========================================================
(function setupContacto(){
  const f = getFormByInputId('c-nombre') || getFormByInputId('c-correo') || getFormByInputId('c-comentario');
  if(!f) return; // no estoy en contacto

  f.addEventListener('submit', (e) => {
    clearErrors(f);
    let ok = true;

    const nombre = byId('c-nombre');
    const correo = byId('c-correo');
    const comentario = byId('c-comentario');

    if(!nombre || isEmpty(nombre.value)){
      ok = false; showError(nombre || f, 'El nombre es obligatorio.');
    }
    if(!correo || !isAllowedEmail(correo.value)){
      ok = false; showError(correo || f, 'Usa correo @gmail.com o @duoc.cl');
    }
    if(!comentario || isEmpty(comentario.value)){
      ok = false; showError(comentario || f, 'El comentario es obligatorio.');
    }else if(comentario.value.length > 500){
      ok = false; showError(comentario, 'Máximo 500 caracteres.');
    }

    if(!ok){
      e.preventDefault();
    }else{
      alert('Contacto enviado ✅ (demo)');
    }
  });
})();

// =========================================================
// LOGIN (iniciarSesion.html)
// IDs: l-correo, l-pass
// =========================================================
(function setupLogin(){
  const f = getFormByInputId('l-correo') || getFormByInputId('l-pass');
  if(!f) return; // no estoy en login

  f.addEventListener('submit', (e) => {
    clearErrors(f);
    let ok = true;

    const correo = byId('l-correo');
    const pass = byId('l-pass');

    if(!correo || !isAllowedEmail(correo.value)){
      ok = false; showError(correo || f, 'Correo debe ser @gmail.com o @duoc.cl');
    }
    if(!pass || !isValidPass(pass.value)){
      ok = false; showError(pass || f, 'Contraseña entre 4 y 10 caracteres.');
    }

    if(!ok){
      e.preventDefault();
    }else{
      alert('Inicio de sesión ok ✅ (demo)');
    }
  });
})();

// =========================================================
// REGISTRO (registrarUsuario.html)
// IDs: r-run, r-nombre, r-apellidos, r-correo, r-direccion
// =========================================================
(function setupRegistro(){
  const f = getFormByInputId('r-run') || getFormByInputId('r-correo');
  if(!f) return; // no estoy en registro

  f.addEventListener('submit', (e) => {
    clearErrors(f);
    let ok = true;

    const run = byId('r-run');
    const nombre = byId('r-nombre');
    const apellidos = byId('r-apellidos');
    const correo = byId('r-correo');
    const direccion = byId('r-direccion');

    if(!run || !isValidRUNSimple(run.value)){
      ok = false; showError(run || f, 'RUN sin puntos ni guion, 7 a 9 caracteres. (Ej: 19011022K)');
    }
    if(!nombre || isEmpty(nombre.value)){
      ok = false; showError(nombre || f, 'Nombre obligatorio.');
    }
    if(!apellidos || isEmpty(apellidos.value)){
      ok = false; showError(apellidos || f, 'Apellidos obligatorios.');
    }
    if(!correo || !isAllowedEmail(correo.value)){
      ok = false; showError(correo || f, 'Correo debe ser @gmail.com o @duoc.cl');
    }
    if(!direccion || isEmpty(direccion.value)){
      ok = false; showError(direccion || f, 'Dirección obligatoria.');
    }

    if(!ok){
      e.preventDefault();
    }else{
      alert('Registro creado ✅ (demo)');
    }
  });
})();
