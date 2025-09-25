import { getProducts, setProducts, getProductById, CLP, initUsersSeed, getUsers, setUsers, getOrders, setOrders } from './inventory.js';

// ----- Estado -----
let PRODUCTS = getProducts();
let state = {
  query: "",
  category: "Todos",
  subcategory: null,
  sort: "relevancia",
  cart: JSON.parse(localStorage.getItem("cart") || "{}"),
  user: JSON.parse(localStorage.getItem("user") || "null"),
  usersDB: []
};

// ----- Utils / DOM -----
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const saveCart = () => localStorage.setItem("cart", JSON.stringify(state.cart));

// ----- Seed usuarios -----
initUsersSeed();
state.usersDB = getUsers();

// ----- Auth -----
function renderAuthArea(){
  const area = $("#authArea");
  area.innerHTML = "";
  if (state.user){
    const isAdmin = ["admin","moderator"].includes(state.user.role);
    const wrapDropdown=document.createElement("div");
    wrapDropdown.className="dropdown";

    wrapDropdown.innerHTML=`
      <button class="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
        <img class="auth-avatar" src="https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(state.user.name)}" alt="avatar">
        <span class="d-none d-sm-inline">${state.user.name}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end">
        <li><h6 class="dropdown-header">${state.user.email}</h6></li>
        <li><span class="dropdown-item-text"><span class="badge bg-secondary me-1">Rol</span> ${(state.user.role||"user").toUpperCase()}</span></li>
        ${isAdmin ? '<li><hr class="dropdown-divider"></li><li><button class="dropdown-item" data-bs-toggle="modal" data-bs-target="#adminPanelModal"><i class="bi bi-gear"></i> Panel admin</button></li>' : ''}
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item text-danger" id="logoutBtn"><i class="bi bi-box-arrow-right"></i> Cerrar sesión</button></li>
      </ul>`;

    const container = document.createElement("div");
    container.className="d-flex align-items-center gap-2";

    if (isAdmin){
      // Botón visible directo para abrir el modal
      const adminBtn = document.createElement("button");
      adminBtn.className = "btn btn-outline-secondary d-none d-md-inline-flex align-items-center gap-2";
      adminBtn.setAttribute("data-bs-toggle","modal");
      adminBtn.setAttribute("data-bs-target","#adminPanelModal");
      adminBtn.innerHTML = `<i class="bi bi-gear"></i><span>Admin</span>`;
      container.appendChild(adminBtn);
    }

    container.appendChild(wrapDropdown);
    area.appendChild(container);

    $("#logoutBtn").addEventListener("click", ()=>{
      state.user=null; localStorage.removeItem("user"); renderAuthArea();
    });
  } else {
    area.innerHTML = `
      <button class="btn btn-outline-primary" data-bs-toggle="modal" data-bs-target="#loginModal"><i class="bi bi-box-arrow-in-right"></i> Iniciar sesión</button>
      <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModal"><i class="bi bi-person-plus"></i> Registrarse</button>
    `;
  }
}
function login(email, pass){
  const u=state.usersDB.find(x=>x.email===email && x.pass===pass);
  if(!u) return false;
  state.user={name:u.name,email:u.email,role:u.role||"user"};
  localStorage.setItem("user",JSON.stringify(state.user));
  return true;
}
function register(name,email,pass){
  if(state.usersDB.some(x=>x.email===email)) return {ok:false,msg:"Ese email ya existe."};
  const newU = {name,email,pass,role:"user"};
  state.usersDB.push(newU);
  setUsers(state.usersDB);
  return {ok:true};
}
function bindAuthForms(){
  $("#loginForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const ok = login($("#loginEmail").value.trim(), $("#loginPass").value);
    if(!ok){ alert("Email o contraseña incorrectos."); return; }
    bootstrap.Modal.getInstance(document.getElementById("loginModal"))?.hide();
    renderAuthArea();
  });
  $("#registerForm")?.addEventListener("submit",(e)=>{
    e.preventDefault();
    const r = register($("#regName").value.trim(), $("#regEmail").value.trim(), $("#regPass").value);
    if(!r.ok){ alert(r.msg); return; }
    alert("Cuenta creada (demo). Ahora puedes iniciar sesión.");
    bootstrap.Modal.getInstance(document.getElementById("registerModal"))?.hide();
  });
}

// ----- Categorías (estéticas) -----
const CATS = [
  { name: "Todos" },
  { name: "Electrónica" },
  { name: "Hogar" },
  { name: "Deportes" },
  { name: "Ropa", subcategories: ["Hombre","Mujer","Accesorios"] },
];
const CAT_ICON = {
  "Todos":"bi-grid",
  "Electrónica":"bi-cpu",
  "Hogar":"bi-house-heart",
  "Deportes":"bi-trophy",
  "Ropa":"bi-tshirt"
};
const catLabel = n => `<i class="bi ${CAT_ICON[n]||'bi-grid'}"></i><span>${n}</span>`;

function buildCategoryList(mode){
  let html = "";
  const add = (active, attrs, innerHtml, extraCls) => mode==="list"
    ? `<a href="#" class="list-group-item list-group-item-action category-link cat-link ${extraCls||""} ${active?"active":""}" ${attrs}>${innerHtml}</a>`
    : `<a href="#" class="dropdown-item category-link ${extraCls||""} ${active?"active":""}" ${attrs}>${innerHtml}</a>`;

  // "Todos"
  html += add(state.category==="Todos"&&!state.subcategory, `data-category="Todos"`, catLabel("Todos"));

  CATS.filter(c=>c.name!=="Todos").forEach(cat=>{
    const hasSubs = Array.isArray(cat.subcategories)&&cat.subcategories.length;

    if(mode==="list"){
      html += `<div class="list-group-item bg-transparent border-0 py-2">
        ${add(state.category===cat.name&&!state.subcategory, `data-category="${cat.name}"`, catLabel(cat.name))}
        ${hasSubs?`<div class="mt-2 ps-2 d-flex flex-wrap gap-2">`:""}`;
      if(hasSubs){
        cat.subcategories.forEach(sub=>{
          const active = state.category===cat.name && state.subcategory===sub;
          html += `<a href="#" class="small subcategory-link small-chip ${active?"active":""}" data-category="${cat.name}" data-subcategory="${sub}">${sub}</a>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    } else {
      // dropdown
      html += `<div class="mb-2">
        ${add(state.category===cat.name&&!state.subcategory, `data-category="${cat.name}"`, catLabel(cat.name))}
        ${hasSubs?`<div class="ps-3 py-1 d-flex flex-wrap gap-2">`:""}`;
      if(hasSubs){
        cat.subcategories.forEach(sub=>{
          const active = state.category===cat.name && state.subcategory===sub;
          html += `<a href="#" class="small subcategory-link small-chip ${active?"active":""}" data-category="${cat.name}" data-subcategory="${sub}">${sub}</a>`;
        });
        html += `</div>`;
      }
      html += `</div>`;
    }
  });
  return html;
}
function renderCategories(){
  const side = $("#sidebarCategorias");
  const off  = $("#offcanvasCategoriasList");
  const drop = $("#dropdownCategorias");
  if (side) side.innerHTML = buildCategoryList("list");
  if (off)  off.innerHTML  = buildCategoryList("list");
  if (drop) drop.innerHTML = buildCategoryList("dropdown");

  const hideOff = ()=>{ const el=document.getElementById('offcanvasCategorias'); el && bootstrap.Offcanvas.getInstance(el)?.hide(); };
  $$(".category-link").forEach(a=>a.addEventListener("click",e=>{
    e.preventDefault(); state.category=a.dataset.category; state.subcategory=null; hideOff(); renderAll();
  }));
  $$(".subcategory-link").forEach(a=>a.addEventListener("click",e=>{
    e.preventDefault(); state.category=a.dataset.category; state.subcategory=a.dataset.subcategory; hideOff(); renderAll();
  }));
  $("#clearFiltersBtn")?.addEventListener("click", ()=>{ state.category="Todos"; state.subcategory=null; renderAll(); });
  highlightFilters();
}
function highlightFilters(){
  const box = $("#activeFilters"); const chips=[];
  if (state.category!=="Todos") chips.push(`<span class="small-chip">${state.category}</span>`);
  if (state.subcategory) chips.push(`<span class="small-chip">${state.subcategory}</span>`);
  if(chips.length){ box.classList.remove("d-none"); box.innerHTML=`<div class="d-flex align-items-center gap-2">${chips.join("")}
      <button class="btn btn-sm btn-outline-secondary" id="clearFiltersInline">Limpiar</button></div>`;
    $("#clearFiltersInline").addEventListener("click", ()=>{ state.category="Todos"; state.subcategory=null; renderAll(); });
  } else { box.classList.add("d-none"); box.innerHTML=""; }
}

// ----- Productos -----
function filteredProducts(){
  let list = PRODUCTS.filter(p =>
    (state.category==="Todos" || p.category===state.category) &&
    (!state.subcategory || p.subcategory===state.subcategory) &&
    p.name.toLowerCase().includes(state.query.toLowerCase())
  );
  switch (state.sort){
    case "precio-asc": list.sort((a,b)=>a.price-b.price); break;
    case "precio-desc": list.sort((a,b)=>b.price-a.price); break;
    case "nombre-asc": list.sort((a,b)=>a.name.localeCompare(b.name)); break;
    case "nombre-desc": list.sort((a,b)=>b.name.localeCompare(a.name)); break;
  }
  return list;
}
function renderProducts(){
  const grid=$("#productGrid"), empty=$("#emptyState"), rc=$("#resultCount");
  const prods = filteredProducts();
  grid.innerHTML=""; rc.textContent = `(${prods.length})`;
  if (!prods.length){ empty.classList.remove("d-none"); return; }
  empty.classList.add("d-none");
  prods.forEach(p=>{
    const col=document.createElement("div");
    col.className="col-12 col-sm-6 col-md-4";
    col.innerHTML=`
      <article class="card h-100 product-card" aria-label="${p.name}">
        <img src="${p.img}" class="card-img-top" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h3 class="h6 card-title">${p.name}</h3>
          <div class="text-muted small mb-2">
            ${p.category}${p.subcategory?` · <span class="small-chip">${p.subcategory}</span>`:""}
            · <span class="${p.stock>0?'text-success':'text-danger'}">Stock: ${p.stock}</span>
          </div>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <strong>${CLP(p.price)}</strong>
            <button class="btn btn-sm btn-primary add-to-cart" data-id="${p.id}" ${p.stock<=0?'disabled':''}>
              <i class="bi bi-plus-lg"></i> Agregar
            </button>
          </div>
        </div>
      </article>`;
    grid.appendChild(col);
  });
  $$(".add-to-cart").forEach(b=>b.addEventListener("click",()=>addToCart(b.dataset.id,1)));
}
function renderOfertas(){
  const ofertas = [1,3,8].map(id => PRODUCTS.find(p=>p.id===id)).filter(Boolean);
  const grid = $("#ofertasGrid"); grid.innerHTML="";
  ofertas.forEach(p=>{
    const col=document.createElement("div");
    col.className="col-12 col-md-4";
    col.innerHTML=`
      <article class="card h-100">
        <img src="${p.img}" class="card-img-top" alt="${p.name}">
        <div class="card-body d-flex flex-column">
          <h3 class="h6">${p.name}</h3>
          <p class="small text-muted mb-2">Oferta limitada</p>
          <div class="mt-auto d-flex justify-content-between align-items-center">
            <strong>${CLP(p.price)}</strong>
            <a class="btn btn-sm btn-outline-primary" href="#catalogo">Ver más</a>
          </div>
        </div>
      </article>`;
    grid.appendChild(col);
  });
}

// ----- Carrito -----
function cartItems(){
  return Object.entries(state.cart).map(([id,qty])=>{
    const p=PRODUCTS.find(pp=>pp.id===Number(id));
    return { ...p, qty:Number(qty), subtotal:p.price*qty };
  });
}
function cartTotal(){ return cartItems().reduce((s,i)=>s+i.subtotal,0); }
function renderCart(){
  const list=$("#cartList"), totalEl=$("#cartTotal"), countEl=$("#cartCount");
  list.innerHTML="";
  const items=cartItems();
  if(!items.length){ list.innerHTML=`<li class="list-group-item text-center text-muted bg-transparent border-0">Tu carrito está vacío.</li>`; }
  else items.forEach(it=>{
    const li=document.createElement("li");
    li.className="list-group-item p-0 border-0 bg-transparent";
    li.innerHTML=`
      <div class="cart-item">
        <img src="${it.img}" alt="${it.name}" class="cart-thumb">
        <div class="flex-grow-1">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="fw-semibold">${it.name}</div>
              <div class="small text-muted">${CLP(it.price)} c/u</div>
            </div>
            <button class="btn btn-sm btn-outline-danger remove-item" data-id="${it.id}">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="mt-2 d-flex align-items-center gap-2">
            <label class="small text-muted" for="qty_${it.id}">Cantidad:</label>
            <input id="qty_${it.id}" type="number" min="1" class="form-control form-control-sm qty-input" value="${it.qty}" data-id="${it.id}" style="width:90px">
            <span class="ms-auto fw-semibold">${CLP(it.subtotal)}</span>
          </div>
        </div>
      </div>`;
    list.appendChild(li);
  });
  totalEl.textContent=CLP(cartTotal());
  countEl && (countEl.textContent=Object.values(state.cart).reduce((a,b)=>a+Number(b),0));
  $$(".remove-item").forEach(btn=>btn.addEventListener("click",()=>{ delete state.cart[btn.dataset.id]; saveCart(); renderCart(); }));
  $$(".qty-input").forEach(inp=>inp.addEventListener("change",()=>{ const n=Math.max(1,Number(inp.value)||1); state.cart[inp.dataset.id]=n; saveCart(); renderCart(); }));
}
function addToCart(id,qty=1){
  const prod = getProductById(id);
  if(!prod){ alert("Producto no encontrado."); return; }
  if(prod.stock < qty){ alert("Sin stock suficiente."); return; }
  state.cart[id]=(state.cart[id]||0)+qty;
  prod.stock -= qty;               // Descontar stock en demo
  setProducts(PRODUCTS);
  saveCart();
  renderProducts(); renderCart();
}

// ----- Checkout (crear pedido) -----
function bindCheckout(){
  $("#checkoutBtn")?.addEventListener("click", ()=>{
    const items = cartItems();
    if(!items.length){ alert("Tu carrito está vacío."); return; }
    if(!state.user){
      alert("Inicia sesión para finalizar la compra.");
      const modal = new bootstrap.Modal(document.getElementById("loginModal"));
      modal.show();
      return;
    }
    const subtotal = cartTotal();
    const envio = subtotal >= 50000 ? 0 : 2990;
    const order = {
      id: "PED-"+Date.now(),
      createdAt: Date.now(),
      user: state.user,
      items: items.map(it=>({ id:it.id, name:it.name, price:it.price, qty:it.qty, subtotal:it.subtotal })),
      totals: { subtotal, envio, total: subtotal+envio },
      shipping: { metodo:"Retiro en tienda", direccion:"", comuna:"", region:"", comentarios:"" },
      tracking:"", notes:"", status:"pendiente"
    };
    const orders = getOrders();
    orders.unshift(order);
    setOrders(orders);
    state.cart = {}; saveCart();
    renderCart();
    alert("¡Gracias! Pedido creado: "+order.id);
    window.location.href = "pedidos.html";
  });
}

// ----- UI binds -----
function bindUI(){
  $("#searchInput").addEventListener("input", e=>{ state.query=e.target.value.trim(); renderProducts(); });
  $("#sortSelect").addEventListener("change", e=>{ state.sort=e.target.value; renderProducts(); });
  $("#clearCartBtn").addEventListener("click", ()=>{ state.cart={}; saveCart(); renderCart(); });
  bindCheckout();
  // contacto
  const form = $("#contactForm"), result=$("#contactResult");
  form.addEventListener("submit", e=>{
    e.preventDefault();
    if(form.checkValidity()){
      result.textContent = "Mensaje enviado correctamente (demo).";
      result.className = "alert alert-success mt-3";
    } else {
      result.textContent = "Es necesario rellenar el formulario.";
      result.className = "alert alert-danger mt-3";
    }
    result.classList.remove("d-none");
  });
}

// ----- Render general -----
function renderAll(){
  renderAuthArea();
  renderCategories();
  renderProducts();
  renderOfertas();
  renderCart();
  $("#year").textContent = new Date().getFullYear();
}

// ----- Init -----
(function init(){
  renderAll();
  bindUI();
  bindAuthForms();
})();
