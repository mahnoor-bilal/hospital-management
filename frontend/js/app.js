
// ============ STATE ============
let currentUser = null;
let currentPage = 1;
let patientSearch = '';
let editingId = null;

// ============ INIT ============
window.onload = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const res = await api.me();
      currentUser = res.user;
      showApp();
    } catch { showLoginPage(); }
  } else {
    showLoginPage();
  }
};

// ============ AUTH ============
async function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  errEl.classList.add('hidden');
  try {
    const res = await api.login(email, password);
    localStorage.setItem('token', res.token);
    currentUser = res.user;
    showApp();
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

async function register() {
  const data = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    role: document.getElementById('regRole').value,
    phone: document.getElementById('regPhone').value,
  };
  const errEl = document.getElementById('registerError');
  const succEl = document.getElementById('registerSuccess');
  errEl.classList.add('hidden'); succEl.classList.add('hidden');
  try {
    await api.register(data);
    succEl.textContent = 'Account created! Please sign in.';
    succEl.classList.remove('hidden');
    setTimeout(showLogin, 1500);
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('hidden');
  }
}

function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  showLoginPage();
}

// ============ PAGE ROUTING ============
function showLoginPage() {
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('registerPage').classList.remove('active');
  document.getElementById('mainApp').classList.add('hidden');
}

function showLogin() {
  document.getElementById('loginPage').classList.add('active');
  document.getElementById('registerPage').classList.remove('active');
}

function showRegister() {
  document.getElementById('registerPage').classList.add('active');
  document.getElementById('loginPage').classList.remove('active');
}

function showApp() {
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('registerPage').classList.remove('active');
  document.getElementById('mainApp').classList.remove('hidden');

  if (currentUser) {
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userRole').textContent = currentUser.role;
    document.getElementById('userAvatar').textContent = currentUser.name[0].toUpperCase();
  }
  navigate('dashboard');
}

function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('view-' + view).classList.add('active');
  document.querySelector('[onclick="navigate(\'' + view + '\')"]').classList.add('active');

  const titles = { dashboard: 'Dashboard', patients: 'Patients', doctors: 'Doctors', appointments: 'Appointments', wards: 'Wards', billing: 'Billing & Payments' };
  document.getElementById('pageTitle').textContent = titles[view] || view;

  if (view === 'dashboard') loadDashboard();
  else if (view === 'patients') loadPatients();
  else if (view === 'doctors') loadDoctors();
  else if (view === 'appointments') loadAppointments();
  else if (view === 'wards') loadWards();
  else if (view === 'billing') loadBilling();
}

// ============ DASHBOARD ============
async function loadDashboard() {
  try {
    const res = await api.getStats();
    const d = res.data;

    document.getElementById('statsGrid').innerHTML = `
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon blue">♟</div>
          <span class="stat-card-badge badge badge-blue">Active</span>
        </div>
        <div class="stat-card-value">${d.totalPatients}</div>
        <div class="stat-card-label">Total Patients</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon green">⚕</div>
          <span class="stat-card-badge badge badge-green">On Duty</span>
        </div>
        <div class="stat-card-value">${d.totalDoctors}</div>
        <div class="stat-card-label">Doctors</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon orange">◷</div>
          <span class="stat-card-badge badge badge-orange">Today</span>
        </div>
        <div class="stat-card-value">${d.todayAppointments}</div>
        <div class="stat-card-label">Appointments Today</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-header">
          <div class="stat-card-icon red">◈</div>
          <span class="stat-card-badge badge badge-red">Pending</span>
        </div>
        <div class="stat-card-value">${d.pendingBills}</div>
        <div class="stat-card-label">Pending Bills</div>
      </div>
    `;

    const tbody = document.getElementById('recentAppointmentsBody');
    tbody.innerHTML = d.recentAppointments.map(a => `
      <tr>
        <td>${a.patient?.name || 'N/A'}</td>
        <td>${a.doctor?.name || 'N/A'}</td>
        <td>${new Date(a.date).toLocaleDateString()}</td>
        <td>${statusBadge(a.status)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;color:#64748b">No appointments</td></tr>';

    const occ = document.getElementById('wardOccupancy');
    occ.innerHTML = `
      <div style="padding: 0 1.5rem">
        <div style="display:flex;justify-content:space-between;margin-bottom:.75rem;font-size:.875rem">
          <span>Beds occupied: <b>${d.occupiedBeds}/${d.totalBeds}</b></span>
          <span style="color:var(--accent)">${d.totalBeds ? Math.round(d.occupiedBeds/d.totalBeds*100) : 0}%</span>
        </div>
        <div class="progress-bar" style="height:12px;margin-bottom:1.5rem">
          <div class="progress-fill" style="width:${d.totalBeds ? (d.occupiedBeds/d.totalBeds*100) : 0}%"></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="stat-card" style="padding:1rem">
            <div style="font-size:.75rem;color:var(--text-secondary)">Available</div>
            <div style="font-size:1.5rem;font-family:var(--font-serif);color:var(--success)">${d.availableBeds}</div>
          </div>
          <div class="stat-card" style="padding:1rem">
            <div style="font-size:.75rem;color:var(--text-secondary)">Revenue</div>
            <div style="font-size:1.5rem;font-family:var(--font-serif);color:var(--accent)">₨${(d.totalRevenue||0).toLocaleString()}</div>
          </div>
        </div>
      </div>
    `;
  } catch (e) { showToast('Failed to load dashboard: ' + e.message); }
}

// ============ PATIENTS ============
async function loadPatients(page = 1) {
  currentPage = page;
  try {
    let params = '?page=' + page + '&limit=10';
    if (patientSearch) params += '&search=' + encodeURIComponent(patientSearch);
    const res = await api.getPatients(params);
    const tbody = document.getElementById('patientsBody');
    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td><span class="badge badge-blue">${p.patientId}</span></td>
        <td><b>${p.name}</b></td>
        <td>${p.age}</td>
        <td>${p.gender}</td>
        <td>${p.phone}</td>
        <td>${p.bloodGroup ? '<span class="badge badge-red">'+p.bloodGroup+'</span>' : '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="editPatient('${p._id}')">✏️</button>
            <button class="btn-icon danger" onclick="deletePatient('${p._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#64748b">No patients found</td></tr>';

    // Pagination
    const pg = document.getElementById('patientPagination');
    pg.innerHTML = '';
    for (let i = 1; i <= res.pages; i++) {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (i === page ? ' active' : '');
      btn.textContent = i;
      btn.onclick = () => loadPatients(i);
      pg.appendChild(btn);
    }
  } catch (e) { showToast('Error loading patients: ' + e.message); }
}

function searchPatients(val) {
  patientSearch = val;
  clearTimeout(window.searchTimeout);
  window.searchTimeout = setTimeout(() => loadPatients(1), 400);
}

async function editPatient(id) {
  try {
    const res = await api.getPatient(id);
    const p = res.data;
    editingId = id;
    document.getElementById('patientModalTitle').textContent = 'Edit Patient';
    document.getElementById('patientId').value = id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pAge').value = p.age;
    document.getElementById('pGender').value = p.gender;
    document.getElementById('pBlood').value = p.bloodGroup || '';
    document.getElementById('pPhone').value = p.phone;
    document.getElementById('pEmail').value = p.email || '';
    document.getElementById('pAddress').value = p.address || '';
    document.getElementById('pAllergies').value = (p.allergies || []).join(', ');
    openModal('patientModal');
  } catch (e) { showToast('Error: ' + e.message); }
}

async function savePatient() {
  const data = {
    name: document.getElementById('pName').value,
    age: parseInt(document.getElementById('pAge').value),
    gender: document.getElementById('pGender').value,
    bloodGroup: document.getElementById('pBlood').value,
    phone: document.getElementById('pPhone').value,
    email: document.getElementById('pEmail').value,
    address: document.getElementById('pAddress').value,
    allergies: document.getElementById('pAllergies').value.split(',').map(s=>s.trim()).filter(Boolean),
  };
  try {
    const id = document.getElementById('patientId').value;
    if (id) await api.updatePatient(id, data);
    else await api.createPatient(data);
    closeAllModals();
    loadPatients(currentPage);
    showToast('Patient saved successfully!');
  } catch (e) { showToast('Error: ' + e.message); }
}

async function deletePatient(id) {
  if (!confirm('Deactivate this patient?')) return;
  try {
    await api.deletePatient(id);
    loadPatients(currentPage);
    showToast('Patient deactivated');
  } catch (e) { showToast('Error: ' + e.message); }
}

// ============ DOCTORS ============
async function loadDoctors() {
  try {
    const res = await api.getDoctors();
    document.getElementById('doctorsBody').innerHTML = res.data.map(d => `
      <tr>
        <td><span class="badge badge-blue">${d.doctorId}</span></td>
        <td><b>${d.name}</b>${d.qualification ? '<br><small style="color:#64748b">'+d.qualification+'</small>' : ''}</td>
        <td>${d.specialization}</td>
        <td>${d.phone}</td>
        <td>₨${(d.consultationFee||0).toLocaleString()}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="editDoctor('${d._id}')">✏️</button>
            <button class="btn-icon danger" onclick="deleteDoctor('${d._id}')">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#64748b">No doctors found</td></tr>';
  } catch (e) { showToast('Error: ' + e.message); }
}

async function editDoctor(id) {
  try {
    const res = await api.getDoctor(id);
    const d = res.data;
    editingId = id;
    document.getElementById('doctorModalTitle').textContent = 'Edit Doctor';
    document.getElementById('doctorId').value = id;
    document.getElementById('dName').value = d.name;
    document.getElementById('dSpec').value = d.specialization;
    document.getElementById('dEmail').value = d.email;
    document.getElementById('dPhone').value = d.phone;
    document.getElementById('dQual').value = d.qualification || '';
    document.getElementById('dExp').value = d.experience || '';
    document.getElementById('dFee').value = d.consultationFee || '';
    openModal('doctorModal');
  } catch (e) { showToast('Error: ' + e.message); }
}

async function saveDoctor() {
  const data = {
    name: document.getElementById('dName').value,
    specialization: document.getElementById('dSpec').value,
    email: document.getElementById('dEmail').value,
    phone: document.getElementById('dPhone').value,
    qualification: document.getElementById('dQual').value,
    experience: parseInt(document.getElementById('dExp').value) || 0,
    consultationFee: parseFloat(document.getElementById('dFee').value) || 0,
  };
  try {
    const id = document.getElementById('doctorId').value;
    if (id) await api.updateDoctor(id, data);
    else await api.createDoctor(data);
    closeAllModals();
    loadDoctors();
    showToast('Doctor saved!');
  } catch (e) { showToast('Error: ' + e.message); }
}

async function deleteDoctor(id) {
  if (!confirm('Remove this doctor?')) return;
  try {
    await api.deleteDoctor(id);
    loadDoctors();
    showToast('Doctor removed');
  } catch (e) { showToast('Error: ' + e.message); }
}

// ============ APPOINTMENTS ============
async function loadAppointments() {
  try {
    let params = '?';
    const status = document.getElementById('apptStatusFilter').value;
    const date = document.getElementById('apptDateFilter').value;
    if (status) params += 'status=' + status + '&';
    if (date) params += 'date=' + date;

    const res = await api.getAppointments(params);
    document.getElementById('appointmentsBody').innerHTML = res.data.map(a => `
      <tr>
        <td><span class="badge badge-gray">${a.appointmentId}</span></td>
        <td>${a.patient?.name || 'N/A'}<br><small style="color:#64748b">${a.patient?.patientId||''}</small></td>
        <td>${a.doctor?.name || 'N/A'}</td>
        <td>${new Date(a.date).toLocaleDateString()}</td>
        <td>${a.time}</td>
        <td><span class="badge badge-blue">${a.type}</span></td>
        <td>${statusBadge(a.status)}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="editAppointment('${a._id}', '${a.patient?._id}', '${a.doctor?._id}', '${a.date}', '${a.time}', '${a.type}', '${a.status}')">✏️</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#64748b">No appointments</td></tr>';
  } catch (e) { showToast('Error: ' + e.message); }
}

async function openAppointmentModal() {
  editingId = null;
  document.getElementById('appointmentId').value = '';
  document.getElementById('appointmentModalTitle').textContent = 'Schedule Appointment';
  await populatePatientDoctorSelects();
  openModal('appointmentModal');
}

async function populatePatientDoctorSelects() {
  const [pRes, dRes] = await Promise.all([api.getPatients(), api.getDoctors()]);
  document.getElementById('apptPatient').innerHTML = pRes.data.map(p => `<option value="${p._id}">${p.name} (${p.patientId})</option>`).join('');
  document.getElementById('apptDoctor').innerHTML = dRes.data.map(d => `<option value="${d._id}">${d.name} - ${d.specialization}</option>`).join('');
  // Also billing
  if (document.getElementById('billPatient')) {
    document.getElementById('billPatient').innerHTML = pRes.data.map(p => `<option value="${p._id}">${p.name} (${p.patientId})</option>`).join('');
  }
}

function editAppointment(id, patId, docId, date, time, type, status) {
  editingId = id;
  document.getElementById('appointmentId').value = id;
  document.getElementById('appointmentModalTitle').textContent = 'Edit Appointment';
  document.getElementById('apptDate').value = new Date(date).toISOString().split('T')[0];
  document.getElementById('apptTime').value = time;
  document.getElementById('apptType').value = type;
  document.getElementById('apptStatus').value = status;
  populatePatientDoctorSelects().then(() => {
    document.getElementById('apptPatient').value = patId;
    document.getElementById('apptDoctor').value = docId;
  });
  openModal('appointmentModal');
}

async function saveAppointment() {
  const data = {
    patient: document.getElementById('apptPatient').value,
    doctor: document.getElementById('apptDoctor').value,
    date: document.getElementById('apptDate').value,
    time: document.getElementById('apptTime').value,
    type: document.getElementById('apptType').value,
    status: document.getElementById('apptStatus').value,
    symptoms: document.getElementById('apptSymptoms').value,
  };
  try {
    const id = document.getElementById('appointmentId').value;
    if (id) await api.updateAppointment(id, data);
    else await api.createAppointment(data);
    closeAllModals();
    loadAppointments();
    showToast('Appointment saved!');
  } catch (e) { showToast('Error: ' + e.message); }
}

// Override openModal for appointment to populate selects
const _origOpenModal = window.openModal;

// ============ WARDS ============
async function loadWards() {
  try {
    const res = await api.getWards();
    const colors = { General:'badge-blue', ICU:'badge-red', Pediatric:'badge-green', Maternity:'badge-orange', Surgical:'badge-blue', Emergency:'badge-red' };
    document.getElementById('wardsGrid').innerHTML = res.data.map(w => {
      const pct = w.totalBeds ? Math.round(w.occupiedBeds/w.totalBeds*100) : 0;
      const beds = Array.from({length: Math.min(w.totalBeds, 20)}, (_, i) =>
        `<div class="bed ${i < w.occupiedBeds ? 'occupied' : 'available'}" title="${i < w.occupiedBeds ? 'Occupied' : 'Available'}"></div>`
      ).join('');
      return `
        <div class="ward-card">
          <div class="ward-card-header">
            <div>
              <div class="ward-title">${w.wardNumber}</div>
              <div class="ward-type">${w.wardType} Ward · Floor ${w.floorNumber||'N/A'}</div>
            </div>
            <span class="badge ${colors[w.wardType]||'badge-gray'}">${pct}% Full</span>
          </div>
          <div class="ward-beds">${beds}${w.totalBeds > 20 ? '<span style="font-size:.75rem;color:#64748b">+' + (w.totalBeds-20) + ' more</span>' : ''}</div>
          <div class="ward-info"><span>${w.occupiedBeds} / ${w.totalBeds} beds occupied</span><span>₨${(w.perDayCharge||0).toLocaleString()}/day</span></div>
          <div class="ward-meta">
            ${w.assignedNurse ? '<span>👩‍⚕️ Nurse: ' + w.assignedNurse + '</span>' : ''}
          </div>
          <div class="ward-actions">
            <button class="btn btn-ghost btn-sm" onclick="editWard('${w._id}', '${w.wardNumber}', '${w.wardType}', ${w.totalBeds}, ${w.occupiedBeds}, ${w.floorNumber||0}, '${w.assignedNurse||''}', ${w.perDayCharge||0})">Edit</button>
            <button class="btn btn-sm" style="background:var(--danger-light);color:var(--danger)" onclick="deleteWard('${w._id}')">Remove</button>
          </div>
        </div>
      `;
    }).join('') || '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#64748b">No wards configured</div>';
  } catch (e) { showToast('Error: ' + e.message); }
}

function editWard(id, num, type, total, occ, floor, nurse, charge) {
  document.getElementById('wNum').value = num;
  document.getElementById('wType').value = type;
  document.getElementById('wBeds').value = total;
  document.getElementById('wFloor').value = floor;
  document.getElementById('wNurse').value = nurse;
  document.getElementById('wCharge').value = charge;
  editingId = id;
  openModal('wardModal');
}

async function saveWard() {
  const data = {
    wardNumber: document.getElementById('wNum').value,
    wardType: document.getElementById('wType').value,
    totalBeds: parseInt(document.getElementById('wBeds').value),
    floorNumber: parseInt(document.getElementById('wFloor').value) || 1,
    assignedNurse: document.getElementById('wNurse').value,
    perDayCharge: parseFloat(document.getElementById('wCharge').value) || 0,
  };
  try {
    if (editingId) await api.updateWard(editingId, data);
    else await api.createWard(data);
    closeAllModals();
    loadWards();
    showToast('Ward saved!');
  } catch (e) { showToast('Error: ' + e.message); }
}

async function deleteWard(id) {
  if (!confirm('Delete this ward?')) return;
  try {
    await api.deleteWard(id);
    loadWards();
    showToast('Ward deleted');
  } catch (e) { showToast('Error: ' + e.message); }
}

// ============ BILLING ============
async function loadBilling() {
  try {
    const status = document.getElementById('billStatusFilter').value;
    const res = await api.getBilling(status ? '?status=' + status : '');
    const statusColors = { Pending: 'badge-orange', Paid: 'badge-green', Partial: 'badge-blue', Cancelled: 'badge-gray' };
    document.getElementById('billingBody').innerHTML = res.data.map(b => `
      <tr>
        <td><span class="badge badge-gray">${b.billId}</span></td>
        <td>${b.patient?.name || 'N/A'}<br><small style="color:#64748b">${b.patient?.patientId||''}</small></td>
        <td><b>₨${(b.totalAmount||0).toLocaleString()}</b></td>
        <td>₨${(b.paidAmount||0).toLocaleString()}</td>
        <td><span class="badge ${statusColors[b.status]||'badge-gray'}">${b.status}</span></td>
        <td>${b.paymentMethod}</td>
        <td>${new Date(b.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="table-actions">
            <button class="btn-icon" onclick="markPaid('${b._id}')">✅</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#64748b">No bills found</td></tr>';
  } catch (e) { showToast('Error: ' + e.message); }
}

async function markPaid(id) {
  try {
    const bill = (await api.getBilling()).data.find(b => b._id === id);
    await api.updateBill(id, { status: 'Paid', paidAmount: bill?.totalAmount });
    loadBilling();
    showToast('Bill marked as paid!');
  } catch (e) { showToast('Error: ' + e.message); }
}

function addBillItem() {
  const container = document.getElementById('billItems');
  const div = document.createElement('div');
  div.className = 'bill-item';
  div.innerHTML = `
    <input placeholder="Description" class="input bill-desc">
    <input type="number" placeholder="Qty" class="input bill-qty" value="1">
    <input type="number" placeholder="Unit Price" class="input bill-price">
    <button onclick="removeBillItem(this)" class="btn-remove">✕</button>
  `;
  container.appendChild(div);
}

function removeBillItem(btn) {
  btn.closest('.bill-item').remove();
}

async function saveBill() {
  const items = Array.from(document.querySelectorAll('.bill-item')).map(row => {
    const desc = row.querySelector('.bill-desc').value;
    const qty = parseFloat(row.querySelector('.bill-qty').value) || 1;
    const price = parseFloat(row.querySelector('.bill-price').value) || 0;
    return { description: desc, quantity: qty, unitPrice: price, total: qty * price };
  }).filter(i => i.description);

  const subtotal = items.reduce((a, i) => a + i.total, 0);
  const tax = parseFloat(document.getElementById('billTax').value) || 0;
  const discount = parseFloat(document.getElementById('billDiscount').value) || 0;
  const totalAmount = subtotal + (subtotal * tax / 100) - discount;

  const data = {
    patient: document.getElementById('billPatient').value,
    items, subtotal,
    tax: subtotal * tax / 100,
    discount, totalAmount,
    paidAmount: document.getElementById('billStatus').value === 'Paid' ? totalAmount : 0,
    status: document.getElementById('billStatus').value,
    paymentMethod: document.getElementById('billMethod').value,
  };
  try {
    await api.createBill(data);
    closeAllModals();
    loadBilling();
    showToast('Bill created!');
  } catch (e) { showToast('Error: ' + e.message); }
}

// ============ MODALS ============
function openModal(id) {
  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById(id).classList.remove('hidden');
  if (id === 'patientModal' && !document.getElementById('patientId').value) {
    editingId = null;
    document.getElementById('patientModalTitle').textContent = 'Add Patient';
    document.getElementById('patientId').value = '';
    ['pName','pAge','pPhone','pEmail','pAddress','pAllergies'].forEach(f => document.getElementById(f).value = '');
    document.getElementById('pGender').value = 'Male';
    document.getElementById('pBlood').value = '';
  }
  if (id === 'doctorModal' && !editingId) {
    document.getElementById('doctorModalTitle').textContent = 'Add Doctor';
    document.getElementById('doctorId').value = '';
    ['dName','dSpec','dEmail','dPhone','dQual','dExp','dFee'].forEach(f => document.getElementById(f).value = '');
  }
  if (id === 'appointmentModal') {
    populatePatientDoctorSelects();
    if (!editingId) {
      ['apptSymptoms'].forEach(f => document.getElementById(f).value = '');
      document.getElementById('apptStatus').value = 'Scheduled';
    }
  }
  if (id === 'billingModal') {
    populatePatientDoctorSelects();
    document.getElementById('billItems').innerHTML = `
      <div class="bill-item">
        <input placeholder="Description" class="input bill-desc">
        <input type="number" placeholder="Qty" class="input bill-qty" value="1">
        <input type="number" placeholder="Unit Price" class="input bill-price">
        <button onclick="removeBillItem(this)" class="btn-remove">✕</button>
      </div>
    `;
  }
  if (id === 'wardModal' && !editingId) {
    ['wNum','wBeds','wFloor','wNurse','wCharge'].forEach(f => document.getElementById(f).value = '');
  }
}

function closeAllModals() {
  document.getElementById('modalOverlay').classList.add('hidden');
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  editingId = null;
}

// ============ UTILITIES ============
function statusBadge(status) {
  const map = { Scheduled: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red', 'No-Show': 'badge-gray' };
  return `<span class="badge ${map[status]||'badge-gray'}">${status}</span>`;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 3000);
}

function handleGlobalSearch(val) {
  if (document.getElementById('view-patients').classList.contains('active')) {
    document.getElementById('patientSearch').value = val;
    searchPatients(val);
  }
}
