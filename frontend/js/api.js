const API_BASE = '/api';

async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + endpoint, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

const api = {
  login: (email, password) => apiCall('/auth/login', 'POST', { email, password }),
  register: (data) => apiCall('/auth/register', 'POST', data),
  me: () => apiCall('/auth/me'),

  getStats: () => apiCall('/dashboard/stats'),

  getPatients: (params = '') => apiCall('/patients' + params),
  getPatient: (id) => apiCall('/patients/' + id),
  createPatient: (data) => apiCall('/patients', 'POST', data),
  updatePatient: (id, data) => apiCall('/patients/' + id, 'PUT', data),
  deletePatient: (id) => apiCall('/patients/' + id, 'DELETE'),

  getDoctors: (search = '') => apiCall('/doctors' + (search ? '?search=' + search : '')),
  getDoctor: (id) => apiCall('/doctors/' + id),
  createDoctor: (data) => apiCall('/doctors', 'POST', data),
  updateDoctor: (id, data) => apiCall('/doctors/' + id, 'PUT', data),
  deleteDoctor: (id) => apiCall('/doctors/' + id, 'DELETE'),

  getAppointments: (params = '') => apiCall('/appointments' + params),
  createAppointment: (data) => apiCall('/appointments', 'POST', data),
  updateAppointment: (id, data) => apiCall('/appointments/' + id, 'PUT', data),

  getWards: () => apiCall('/wards'),
  createWard: (data) => apiCall('/wards', 'POST', data),
  updateWard: (id, data) => apiCall('/wards/' + id, 'PUT', data),
  deleteWard: (id) => apiCall('/wards/' + id, 'DELETE'),

  getBilling: (params = '') => apiCall('/billing' + params),
  createBill: (data) => apiCall('/billing', 'POST', data),
  updateBill: (id, data) => apiCall('/billing/' + id, 'PUT', data),
};
