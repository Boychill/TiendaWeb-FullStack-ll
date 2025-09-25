// ========= UTILIDAD =========
export const CLP = n => n.toLocaleString("es-CL",{ style:"currency", currency:"CLP", maximumFractionDigits:0 });

// ========= PRODUCTOS =========
const PRODUCTS_BASE = [
  { id:1, name:"Auriculares Bluetooth", price:29990, stock:15, category:"Electrónica", img:"../multimedia/audifonosbluetooth.png" },
  { id:2, name:"Smartwatch Deportivo", price:49990, stock:9,  category:"Electrónica", img:"https://picsum.photos/seed/watch/600/400" },
  { id:3, name:"Zapatillas Running",   price:45990, stock:12, category:"Deportes",    img:"https://picsum.photos/seed/run/600/400" },
  { id:4, name:"Polerón Hombre",        price:24990, stock:7,  category:"Ropa", subcategory:"Hombre", img:"https://picsum.photos/seed/hoodie-man/600/400" },
  { id:5, name:"Polera Mujer",          price:19990, stock:10, category:"Ropa", subcategory:"Mujer",  img:"https://picsum.photos/seed/tshirt-woman/600/400" },
  { id:6, name:"Gorro Unisex",          price:9990,  stock:20, category:"Ropa", subcategory:"Accesorios", img:"https://picsum.photos/seed/hat/600/400" },
  { id:7, name:"Cartera",               price:34990, stock:5,  category:"Ropa", subcategory:"Accesorios", img:"httpsjpgicsum.photos/seed/bag/600/400" },
  { id:8, name:"Cafetera Express",      price:89990, stock:4,  category:"Hogar", img:"https://picsum.photos/seed/coffee/600/400" },
  { id:9, name:"Pelota Fútbol",         price:14990, stock:18, category:"Deportes", img:"https://picsum.photos/seed/ball/600/400" }
];
export function getProducts(){
  const saved = JSON.parse(localStorage.getItem("products") || "null");
  if (!saved) {
    localStorage.setItem("products", JSON.stringify(PRODUCTS_BASE));
    return PRODUCTS_BASE.slice();
  }
  return saved;
}
export function setProducts(list){ localStorage.setItem("products", JSON.stringify(list)); }
export function getProductById(id){ return getProducts().find(p => p.id === Number(id)); }

// ========= USUARIOS (demo local) =========
export function initUsersSeed(){
  if (!localStorage.getItem("usersDB")) {
    localStorage.setItem("usersDB", JSON.stringify([
      { name:"Admin Demo",     email:"admin@demo.cl", pass:"123456", role:"admin" },
      { name:"Moderador Demo", email:"mod@demo.cl",   pass:"123456", role:"moderator" }
    ]));
  }
}
export function getUsers(){ return JSON.parse(localStorage.getItem("usersDB") || "[]"); }
export function setUsers(list){ localStorage.setItem("usersDB", JSON.stringify(list)); }

// ========= PEDIDOS =========
export const ORDER_STATUS = ["pendiente","preparación","enviado","entregado","cancelado"];
export function getOrders(){ return JSON.parse(localStorage.getItem("orders") || "[]"); }
export function setOrders(list){ localStorage.setItem("orders", JSON.stringify(list)); }

// Crea un pedido desde el carrito
export function createOrderFromCart({cart, user, shipping}){
  const PRODUCTS = getProducts();
  const items = Object.entries(cart).map(([id,qty])=>{
    const p = PRODUCTS.find(pp=>pp.id===Number(id));
    return { id:p.id, name:p.name, price:p.price, qty:Number(qty), subtotal:p.price*qty };
  });
  const subtotal = items.reduce((s,i)=>s+i.subtotal,0);
  const envio = shipping?.metodo==="envio" ? 3990 : 0;
  const total = subtotal + envio;

  // Descontar stock
  items.forEach(i=>{
    const prod = PRODUCTS.find(p=>p.id===i.id);
    if(prod) prod.stock = Math.max(0, (prod.stock||0) - i.qty);
  });
  setProducts(PRODUCTS);

  const id = "PED-" + Date.now().toString().slice(-8);
  const order = {
    id,
    createdAt: new Date().toISOString(),
    status: "pendiente",
    items,
    totals: { subtotal, envio, total },
    user: user ? { name:user.name, email:user.email } : null,
    shipping: shipping || {}
  };

  const orders = getOrders();
  orders.unshift(order);
  setOrders(orders);
  return order;
}
