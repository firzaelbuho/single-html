const storageKey = "ekspedisi-dashboard-db-v1";
const dbFiles = {
  branches: "./data/branches.json",
  services: "./data/services.json",
  customers: "./data/customers.json",
  couriers: "./data/couriers.json",
  shipments: "./data/shipments.json",
  tracking: "./data/tracking.json",
  payments: "./data/payments.json"
};

const fallbackDb = {
  branches: [{ branch_id: 1, branch_code: "CGK01", branch_name: "Jakarta Selatan Gateway", branch_type: "PUSAT", city: "Jakarta Selatan", district: "Kebayoran Baru", phone: "0215551000", address: "Jl. Kyai Maja No. 10, Jakarta Selatan", is_active: true }],
  services: [{ service_type_id: 1, service_code: "REG", service_name: "Regular Service", estimated_days: "2-4 hari", cod_available: true, insurance_available: true }],
  customers: [{ customer_id: 1, customer_code: "CUST0001", customer_type: "INDIVIDU", full_name: "Budi Santoso", company_name: "", phone: "081234567890", email: "budi@example.com", city: "Jakarta Selatan", address: "Jl. Radio Dalam No. 5, Jakarta Selatan" }],
  couriers: [{ employee_id: 2, employee_code: "EMP0002", full_name: "Rina Lestari", branch_code: "CGK01", branch_name: "Jakarta Selatan Gateway", phone: "081122223333", vehicle_type: "MOTOR", status: "ON_DELIVERY" }],
  shipments: [{ shipment_id: 1, tracking_no: "JNC2604070001", sender_customer_id: 1, sender_name: "Budi Santoso", receiver_name: "Hendra Wijaya", receiver_phone: "081355566677", origin_branch_code: "CGK01", destination_city: "Semarang", service_code: "REG", courier_employee_id: 2, courier_name: "Rina Lestari", chargeable_weight_kg: 1.2, total_amount: 28500, payment_status: "PAID", shipment_status: "TRANSIT", booked_at: "2026-04-07 09:00:00" }],
  tracking: [{ tracking_id: 1, tracking_no: "JNC2604070001", event_time: "2026-04-07 09:05:00", status_code: "BOOKED", status_description: "Paket berhasil dibuat dan menunggu proses gudang.", branch_name: "Jakarta Selatan Gateway" }],
  payments: [{ payment_id: 1, payment_no: "PAY2604070001", tracking_no: "JNC2604070001", payment_method: "TRANSFER", payment_status: "PAID", amount_due: 28500, amount_paid: 28500, paid_at: "2026-04-07 09:10:00" }]
};

const state = { db: null, activeView: "overview", editShipmentId: null };
const elements = {};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindElements();
  bindEvents();
  state.db = await loadDatabase();
  renderAll();
}

function bindElements() {
  elements.notice = document.querySelector("#notice");
  elements.statCards = document.querySelector("#statCards");
  elements.shipmentTable = document.querySelector("#shipmentTableBody");
  elements.customerTable = document.querySelector("#customerTableBody");
  elements.courierList = document.querySelector("#courierList");
  elements.trackingList = document.querySelector("#trackingList");
  elements.paymentList = document.querySelector("#paymentList");
  elements.searchInput = document.querySelector("#searchInput");
  elements.filterStatus = document.querySelector("#filterStatus");
  elements.navButtons = document.querySelectorAll("[data-view]");
  elements.sections = document.querySelectorAll("[data-section]");
  elements.form = document.querySelector("#shipmentForm");
  elements.formTitle = document.querySelector("#formTitle");
  elements.formHint = document.querySelector("#formHint");
  elements.resetButton = document.querySelector("#resetFormButton");
}

function bindEvents() {
  elements.navButtons.forEach((button) => button.addEventListener("click", () => setActiveView(button.dataset.view)));
  elements.form.addEventListener("submit", handleShipmentSubmit);
  elements.resetButton.addEventListener("click", resetForm);
  elements.searchInput.addEventListener("input", renderShipmentTable);
  elements.filterStatus.addEventListener("change", renderShipmentTable);
}

async function loadDatabase() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    setNotice("Mode lokal aktif. Data dashboard dibaca dari localStorage browser.", "amber");
    return JSON.parse(saved);
  }

  try {
    const entries = await Promise.all(Object.entries(dbFiles).map(async ([key, path]) => [key, await (await fetch(path)).json()]));
    const db = Object.fromEntries(entries);
    persistDb(db);
    setNotice("Data awal berhasil dimuat dari folder sql/data.", "emerald");
    return db;
  } catch (error) {
    persistDb(fallbackDb);
    setNotice("Browser memblokir fetch JSON langsung. Dashboard memakai fallback demo dan tetap bisa di-CRUD.", "rose");
    return structuredClone(fallbackDb);
  }
}

function persistDb(db) {
  localStorage.setItem(storageKey, JSON.stringify(db));
}

function setNotice(message, tone) {
  elements.notice.className = `glass-panel rounded-2xl px-4 py-3 text-sm font-medium ${tone === "emerald" ? "border-emerald-200 bg-emerald-50/90 text-emerald-700" : tone === "rose" ? "border-rose-200 bg-rose-50/90 text-rose-700" : "border-amber-200 bg-amber-50/90 text-amber-700"}`;
  elements.notice.textContent = message;
}

function setActiveView(view) {
  state.activeView = view;
  elements.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  elements.sections.forEach((section) => section.classList.toggle("hidden", section.dataset.section !== view));
}

function renderAll() {
  renderStats();
  renderShipmentTable();
  renderCustomers();
  renderCouriers();
  renderTracking();
  renderPayments();
  populateFormOptions();
  resetForm();
  setActiveView(state.activeView);
}

function renderStats() {
  const shipments = state.db.shipments;
  const revenue = shipments.reduce((sum, item) => sum + Number(item.total_amount || 0), 0);
  const cards = [
    { title: "Total Shipment", value: shipments.length, subtext: "resi aktif di dashboard" },
    { title: "On Delivery", value: shipments.filter((item) => ["TRANSIT", "OUT_FOR_DELIVERY"].includes(item.shipment_status)).length, subtext: "paket sedang bergerak" },
    { title: "Outstanding", value: shipments.filter((item) => item.payment_status !== "PAID").length, subtext: "pembayaran belum lunas" },
    { title: "Revenue", value: formatCurrency(revenue), subtext: `${shipments.filter((item) => item.shipment_status === "DELIVERED").length} paket delivered` }
  ];

  elements.statCards.innerHTML = cards.map((card, index) => `
    <article class="glass-panel rise-in rounded-3xl p-5" style="animation-delay:${index * 70}ms">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">${card.title}</p>
      <p class="mt-3 text-3xl font-black text-slate-900">${card.value}</p>
      <p class="mt-2 text-sm text-slate-500">${card.subtext}</p>
    </article>
  `).join("");
}

function renderShipmentTable() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const statusFilter = elements.filterStatus.value;
  const rows = state.db.shipments.filter((item) => {
    const matchesQuery = !query || item.tracking_no.toLowerCase().includes(query) || item.sender_name.toLowerCase().includes(query) || item.receiver_name.toLowerCase().includes(query) || item.destination_city.toLowerCase().includes(query);
    const matchesStatus = !statusFilter || item.shipment_status === statusFilter;
    return matchesQuery && matchesStatus;
  }).sort((a, b) => b.shipment_id - a.shipment_id);

  elements.shipmentTable.innerHTML = rows.map((item) => `
    <tr class="border-b border-slate-200/70">
      <td class="px-4 py-4 font-semibold text-slate-900">${item.tracking_no}</td>
      <td class="px-4 py-4">${item.sender_name}<div class="text-xs text-slate-500">${item.origin_branch_code}</div></td>
      <td class="px-4 py-4">${item.receiver_name}<div class="text-xs text-slate-500">${item.destination_city}</div></td>
      <td class="px-4 py-4">${item.service_code}</td>
      <td class="px-4 py-4">${item.chargeable_weight_kg} kg</td>
      <td class="px-4 py-4">${formatCurrency(item.total_amount)}</td>
      <td class="px-4 py-4"><span class="status-pill status-${item.shipment_status}">${item.shipment_status}</span></td>
      <td class="px-4 py-4"><span class="status-pill status-${item.payment_status}">${item.payment_status}</span></td>
      <td class="px-4 py-4"><div class="flex flex-wrap gap-2"><button class="rounded-full bg-slate-900 px-3 py-2 text-xs font-bold text-white" data-action="edit" data-id="${item.shipment_id}">Edit</button><button class="rounded-full bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700" data-action="delete" data-id="${item.shipment_id}">Delete</button></div></td>
    </tr>
  `).join("");

  elements.shipmentTable.querySelectorAll("button").forEach((button) => {
    const shipmentId = Number(button.dataset.id);
    if (button.dataset.action === "edit") button.addEventListener("click", () => fillFormForEdit(shipmentId));
    if (button.dataset.action === "delete") button.addEventListener("click", () => deleteShipment(shipmentId));
  });
}

function renderCustomers() {
  elements.customerTable.innerHTML = state.db.customers.map((item) => `
    <tr class="border-b border-slate-200/70">
      <td class="px-4 py-4 font-semibold">${item.customer_code}</td>
      <td class="px-4 py-4">${item.full_name}</td>
      <td class="px-4 py-4">${item.customer_type}</td>
      <td class="px-4 py-4">${item.city}</td>
      <td class="px-4 py-4">${item.phone}</td>
    </tr>
  `).join("");
}

function renderCouriers() {
  elements.courierList.innerHTML = state.db.couriers.map((item) => `
    <article class="glass-panel rise-in rounded-3xl p-4">
      <div class="flex items-start justify-between gap-4">
        <div><p class="text-lg font-bold text-slate-900">${item.full_name}</p><p class="text-sm text-slate-500">${item.employee_code} • ${item.branch_name}</p></div>
        <span class="status-pill status-${item.status}">${item.status}</span>
      </div>
      <div class="mt-4 grid gap-2 text-sm text-slate-600"><p>Telepon: ${item.phone}</p><p>Kendaraan: ${item.vehicle_type}</p></div>
    </article>
  `).join("");
}

function renderTracking() {
  const recentTracking = [...state.db.tracking].sort((a, b) => new Date(b.event_time) - new Date(a.event_time)).slice(0, 8);
  elements.trackingList.innerHTML = recentTracking.map((item) => `
    <article class="relative border-l-2 border-orange-300 pl-5">
      <span class="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-orange-500"></span>
      <p class="text-sm font-bold text-slate-900">${item.tracking_no} • ${item.status_code}</p>
      <p class="mt-1 text-sm text-slate-600">${item.status_description}</p>
      <p class="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">${item.branch_name} • ${item.event_time}</p>
    </article>
  `).join("");
}

function renderPayments() {
  elements.paymentList.innerHTML = [...state.db.payments].sort((a, b) => b.payment_id - a.payment_id).map((item) => `
    <article class="glass-panel rounded-3xl p-4">
      <div class="flex items-center justify-between gap-4">
        <div><p class="font-bold text-slate-900">${item.payment_no}</p><p class="text-sm text-slate-500">${item.tracking_no} • ${item.payment_method}</p></div>
        <span class="status-pill status-${item.payment_status}">${item.payment_status}</span>
      </div>
      <div class="mt-4 text-sm text-slate-600"><p>Tagihan: ${formatCurrency(item.amount_due)}</p><p>Dibayar: ${formatCurrency(item.amount_paid)}</p></div>
    </article>
  `).join("");
}

function populateFormOptions() {
  fillSelect("sender_customer_id", state.db.customers, "customer_id", (item) => `${item.customer_code} - ${item.full_name}`);
  fillSelect("origin_branch_code", state.db.branches, "branch_code", (item) => `${item.branch_code} - ${item.branch_name}`);
  fillSelect("service_code", state.db.services, "service_code", (item) => `${item.service_code} - ${item.service_name}`);
  fillSelect("courier_employee_id", state.db.couriers, "employee_id", (item) => `${item.employee_code} - ${item.full_name}`);
}

function fillSelect(id, list, valueKey, labelBuilder) {
  const select = document.getElementById(id);
  const currentValue = select.value;
  select.innerHTML = `<option value="">Pilih...</option>` + list.map((item) => `<option value="${item[valueKey]}">${labelBuilder(item)}</option>`).join("");
  select.value = currentValue;
}

function handleShipmentSubmit(event) {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const senderId = Number(formData.get("sender_customer_id"));
  const courierId = Number(formData.get("courier_employee_id"));
  const sender = state.db.customers.find((item) => item.customer_id === senderId);
  const courier = state.db.couriers.find((item) => item.employee_id === courierId);

  const payload = {
    shipment_id: state.editShipmentId ?? nextId(state.db.shipments, "shipment_id"),
    tracking_no: String(formData.get("tracking_no")).trim(),
    sender_customer_id: senderId,
    sender_name: sender ? sender.full_name : "Unknown Sender",
    receiver_name: String(formData.get("receiver_name")).trim(),
    receiver_phone: String(formData.get("receiver_phone")).trim(),
    origin_branch_code: String(formData.get("origin_branch_code")).trim(),
    destination_city: String(formData.get("destination_city")).trim(),
    service_code: String(formData.get("service_code")).trim(),
    courier_employee_id: courierId || null,
    courier_name: courier ? courier.full_name : "-",
    chargeable_weight_kg: Number(formData.get("chargeable_weight_kg") || 0),
    total_amount: Number(formData.get("total_amount") || 0),
    payment_status: String(formData.get("payment_status")).trim(),
    shipment_status: String(formData.get("shipment_status")).trim(),
    booked_at: String(formData.get("booked_at")).trim()
  };

  if (!payload.tracking_no || !payload.receiver_name) return setNotice("Tracking number dan nama penerima wajib diisi.", "rose");
  const duplicate = state.db.shipments.find((item) => item.tracking_no === payload.tracking_no && item.shipment_id !== payload.shipment_id);
  if (duplicate) return setNotice("Tracking number sudah dipakai. Gunakan nomor resi lain.", "rose");

  if (state.editShipmentId) {
    const index = state.db.shipments.findIndex((item) => item.shipment_id === state.editShipmentId);
    state.db.shipments[index] = payload;
    syncPaymentRecord(payload);
    syncTrackingRecord(payload, "UPDATE");
    setNotice(`Shipment ${payload.tracking_no} berhasil diperbarui.`, "emerald");
  } else {
    state.db.shipments.push(payload);
    state.db.payments.push({ payment_id: nextId(state.db.payments, "payment_id"), payment_no: `PAY${String(Date.now()).slice(-10)}`, tracking_no: payload.tracking_no, payment_method: payload.payment_status === "UNPAID" ? "COD" : "TRANSFER", payment_status: payload.payment_status, amount_due: payload.total_amount, amount_paid: payload.payment_status === "PAID" ? payload.total_amount : 0, paid_at: payload.payment_status === "PAID" ? payload.booked_at : null });
    state.db.tracking.push({ tracking_id: nextId(state.db.tracking, "tracking_id"), tracking_no: payload.tracking_no, event_time: payload.booked_at, status_code: payload.shipment_status, status_description: "Shipment baru ditambahkan dari dashboard.", branch_name: branchLabel(payload.origin_branch_code) });
    setNotice(`Shipment ${payload.tracking_no} berhasil ditambahkan.`, "emerald");
  }

  persistDb(state.db);
  renderAll();
}

function fillFormForEdit(shipmentId) {
  const shipment = state.db.shipments.find((item) => item.shipment_id === shipmentId);
  if (!shipment) return;
  state.editShipmentId = shipmentId;
  elements.formTitle.textContent = `Edit Shipment ${shipment.tracking_no}`;
  elements.formHint.textContent = "Perubahan akan ikut menyinkronkan data pembayaran dan log tracking terbaru.";
  setInputValue("tracking_no", shipment.tracking_no);
  setInputValue("sender_customer_id", shipment.sender_customer_id);
  setInputValue("receiver_name", shipment.receiver_name);
  setInputValue("receiver_phone", shipment.receiver_phone);
  setInputValue("origin_branch_code", shipment.origin_branch_code);
  setInputValue("destination_city", shipment.destination_city);
  setInputValue("service_code", shipment.service_code);
  setInputValue("courier_employee_id", shipment.courier_employee_id ?? "");
  setInputValue("chargeable_weight_kg", shipment.chargeable_weight_kg);
  setInputValue("total_amount", shipment.total_amount);
  setInputValue("payment_status", shipment.payment_status);
  setInputValue("shipment_status", shipment.shipment_status);
  setInputValue("booked_at", shipment.booked_at);
  setActiveView("crud");
}

function setInputValue(id, value) {
  document.getElementById(id).value = value;
}

function resetForm() {
  state.editShipmentId = null;
  elements.form.reset();
  elements.formTitle.textContent = "Tambah Shipment";
  elements.formHint.textContent = "Form ini mensimulasikan create dan update resi dari dashboard operasional.";
  document.getElementById("booked_at").value = new Date().toISOString().slice(0, 16).replace("T", " ");
}

function deleteShipment(shipmentId) {
  const shipment = state.db.shipments.find((item) => item.shipment_id === shipmentId);
  if (!shipment || !window.confirm(`Hapus shipment ${shipment.tracking_no}?`)) return;
  state.db.shipments = state.db.shipments.filter((item) => item.shipment_id !== shipmentId);
  state.db.payments = state.db.payments.filter((item) => item.tracking_no !== shipment.tracking_no);
  state.db.tracking = state.db.tracking.filter((item) => item.tracking_no !== shipment.tracking_no);
  persistDb(state.db);
  renderAll();
  setNotice(`Shipment ${shipment.tracking_no} berhasil dihapus.`, "amber");
}

function syncPaymentRecord(shipment) {
  const payment = state.db.payments.find((item) => item.tracking_no === shipment.tracking_no);
  if (!payment) return;
  payment.amount_due = shipment.total_amount;
  payment.payment_status = shipment.payment_status;
  payment.amount_paid = shipment.payment_status === "PAID" ? shipment.total_amount : 0;
  payment.paid_at = shipment.payment_status === "PAID" ? shipment.booked_at : null;
}

function syncTrackingRecord(shipment, mode) {
  state.db.tracking.push({ tracking_id: nextId(state.db.tracking, "tracking_id"), tracking_no: shipment.tracking_no, event_time: shipment.booked_at, status_code: shipment.shipment_status, status_description: mode === "UPDATE" ? "Shipment diperbarui dari dashboard." : "Shipment baru dibuat dari dashboard.", branch_name: branchLabel(shipment.origin_branch_code) });
}

function branchLabel(branchCode) {
  const branch = state.db.branches.find((item) => item.branch_code === branchCode);
  return branch ? branch.branch_name : branchCode;
}

function nextId(list, key) {
  return list.reduce((max, item) => Math.max(max, Number(item[key] || 0)), 0) + 1;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
}
