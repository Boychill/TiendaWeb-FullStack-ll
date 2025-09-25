import { getOrders, setOrders, ORDER_STATUS, CLP } from './inventory.js';

let ORDERS = getOrders();
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function statusBadge(st){
  switch(st){
    case "pendiente":   return "badge-pendiente";
    case "preparación": return "badge-preparacion";
    case "enviado":     return "badge-enviado";
    case "entregado":   return "badge-entregado";
    case "cancelado":   return "badge-cancelado";
    default:            return "text-bg-secondary";
  }
}

function renderOrders(){
  const body = $("#ordersTbody");
  body.innerHTML = "";
  const q = $("#orderSearch").value.trim().toLowerCase();
  const f = $("#statusFilter").value;

  const filtered = ORDERS.filter(o=>{
    const hay = JSON.stringify(o).toLowerCase().includes(q);
    const ok  = f==="all" ? true : (o.status===f);
    return hay && ok;
  });

  if(!filtered.length){
    body.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No hay pedidos que coincidan.</td></tr>`;
    return;
  }

  filtered.forEach(o=>{
    const tr = document.createElement("tr");
    const itemsCount = o.items.reduce((s,i)=>s+i.qty,0);
    tr.innerHTML = `
      <td>${o.id}</td>
      <td class="td-truncate">${new Date(o.createdAt).toLocaleString()}</td>
      <td class="td-truncate">${o.user?.name||"-"}<br><small class="text-muted">${o.user?.email||""}</small></td>
      <td>${itemsCount}</td>
      <td>
        <span class="badge ${statusBadge(o.status)} text-uppercase">${o.status}</span>
      </td>
      <td>
        <div class="small">${CLP(o.totals.subtotal)} + ${CLP(o.totals.envio)}</div>
        <strong>${CLP(o.totals.total)}</strong>
      </td>
      <td class="td-truncate">
        ${o.shipping?.metodo||"-"} — ${o.shipping?.comuna||""}, ${o.shipping?.region||""}
      </td>
      <td class="text-end">
        <button class="btn btn-sm btn-outline-secondary me-1 view-order" data-id="${o.id}"><i class="bi bi-eye"></i></button>
        <button class="btn btn-sm btn-outline-primary me-1 edit-order" data-id="${o.id}"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger delete-order" data-id="${o.id}"><i class="bi bi-trash"></i></button>
      </td>`;
    body.appendChild(tr);
  });

  bindRowActions();
}

function bindRowActions(){
  $$(".delete-order").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      if(!confirm("¿Eliminar pedido "+id+"?")) return;
      ORDERS = ORDERS.filter(o=>o.id!==id);
      setOrders(ORDERS); renderOrders();
    });
  });
  $$(".view-order").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const o = ORDERS.find(x=>x.id===btn.dataset.id);
      if(!o) return;
      const lines = o.items.map(i=>`• ${i.name} x${i.qty} — ${CLP(i.subtotal)}`).join("\n");
      alert(
        `Pedido ${o.id}\n`+
        `Fecha: ${new Date(o.createdAt).toLocaleString()}\n`+
        `Cliente: ${o.user?.name||"-"} (${o.user?.email||"-"})\n\n`+
        `Items:\n${lines}\n\n`+
        `Subtotal: ${CLP(o.totals.subtotal)}\n`+
        `Envío: ${CLP(o.totals.envio)}\n`+
        `Total: ${CLP(o.totals.total)}\n\n`+
        `Envío: ${o.shipping?.metodo||"-"} — ${o.shipping?.direccion||"-"}, ${o.shipping?.comuna||"-"}, ${o.shipping?.region||"-"}\n`+
        `Comentarios: ${o.shipping?.comentarios || "-" }\n`+
        `Tracking: ${o.tracking || "-" }\n`+
        `Notas: ${o.notes || "-" }`
      );
    });
  });
  $$(".edit-order").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const o = ORDERS.find(x=>x.id===btn.dataset.id);
      if(!o) return;
      $("#eId").value = o.id;
      $("#eStatus").value = o.status;
      $("#eTracking").value = o.tracking || "";
      $("#eNotes").value = o.notes || "";
      new bootstrap.Modal("#editOrderModal").show();
    });
  });
}

// Editar pedido (estado, tracking, notas)
$("#editOrderForm").addEventListener("submit",(e)=>{
  e.preventDefault();
  const id = $("#eId").value;
  const o = ORDERS.find(x=>x.id===id);
  if(!o) return;
  o.status = $("#eStatus").value;
  o.tracking = $("#eTracking").value.trim();
  o.notes = $("#eNotes").value.trim();
  setOrders(ORDERS);
  bootstrap.Modal.getInstance(document.getElementById("editOrderModal"))?.hide();
  renderOrders();
});

// Filtros / búsqueda
$("#orderSearch").addEventListener("input", renderOrders);
$("#statusFilter").addEventListener("change", renderOrders);

// Export JSON
$("#exportOrders").addEventListener("click", ()=>{
  const blob = new Blob([JSON.stringify(ORDERS,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {href:url, download:"pedidos.json"});
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

// Init
renderOrders();
