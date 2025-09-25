import { getProducts, setProducts } from './inventory.js';

let PRODUCTS = getProducts();
const $ = s => document.querySelector(s);

function renderPanelTable(){
  const tb = $("#panelTableBody");
  tb.innerHTML = "";
  PRODUCTS.forEach(p=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category||""}</td>
      <td>${p.subcategory||""}</td>
      <td><input type="number" class="form-control form-control-sm price-input" value="${p.price}" min="0" step="100" data-id="${p.id}"></td>
      <td><input type="number" class="form-control form-control-sm stock-input" value="${p.stock||0}" min="0" step="1" data-id="${p.id}"></td>
      <td class="text-truncate" style="max-width:220px;">${p.img||""}</td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-primary me-1 edit-row" data-id="${p.id}"><i class="bi bi-pencil-square"></i></button>
        <button class="btn btn-sm btn-outline-danger delete-row" data-id="${p.id}"><i class="bi bi-trash"></i></button>
      </td>`;
    tb.appendChild(tr);
  });

  tb.querySelectorAll(".price-input").forEach(inp=>{
    inp.addEventListener("change", e=>{
      const it = PRODUCTS.find(p=>p.id==e.target.dataset.id);
      it.price = Math.max(0, Number(e.target.value)||0);
      setProducts(PRODUCTS);
    });
  });
  tb.querySelectorAll(".stock-input").forEach(inp=>{
    inp.addEventListener("change", e=>{
      const it = PRODUCTS.find(p=>p.id==e.target.dataset.id);
      it.stock = Math.max(0, Number(e.target.value)||0);
      setProducts(PRODUCTS);
    });
  });
  tb.querySelectorAll(".edit-row").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const p = PRODUCTS.find(x=>x.id==btn.dataset.id);
      $("#pId").value = p.id;
      $("#pName").value = p.name;
      $("#pPrice").value = p.price;
      $("#pStock").value = p.stock||0;
      $("#pCategory").value = p.category||"";
      $("#pSubcategory").value = p.subcategory||"";
      $("#pImg").value = p.img||"";
      window.scrollTo({ top: 0, behavior:"smooth" });
    });
  });
  tb.querySelectorAll(".delete-row").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = Number(btn.dataset.id);
      if(!confirm("¿Eliminar producto ID "+id+"?")) return;
      PRODUCTS = PRODUCTS.filter(x=>x.id!==id);
      setProducts(PRODUCTS); renderPanelTable();
    });
  });
}

document.getElementById("productForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const id = Number(document.getElementById("pId").value)||null;
  const data = {
    name: document.getElementById("pName").value.trim(),
    price: Math.max(0, Number(document.getElementById("pPrice").value)||0),
    stock: Math.max(0, Number(document.getElementById("pStock").value)||0),
    category: document.getElementById("pCategory").value.trim(),
    subcategory: document.getElementById("pSubcategory").value.trim()||undefined,
    img: document.getElementById("pImg").value.trim()||`https://picsum.photos/seed/${Date.now()}/600/400`
  };
  if(id){
    const p = PRODUCTS.find(x=>x.id===id);
    Object.assign(p, data);
  } else {
    const newId = (PRODUCTS.reduce((m,x)=>Math.max(m,x.id),0) || 0) + 1;
    PRODUCTS.push({ id:newId, ...data });
  }
  setProducts(PRODUCTS);
  e.target.reset();
  renderPanelTable();
});
document.getElementById("productFormReset").addEventListener("click", ()=>{ document.getElementById("pId").value=""; });
document.getElementById("exportJson").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(PRODUCTS,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {href:url, download:"productos.json"});
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

renderPanelTable();
