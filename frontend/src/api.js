/* api.js — all fetch calls to the backend */

const BASE = '/api';

async function get(path) {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/* Dashboard */
export const getDashboardSummary = () => get('/dashboard/summary');

/* Incidents */
export const getIncidents = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) qs.set(k, v); });
  const q = qs.toString();
  return get('/incidents' + (q ? '?' + q : ''));
};
export const getIncident       = (id)     => get(`/incidents/${id}`);
export const getIncidentTimeline = (id)   => get(`/incidents/${id}/timeline`);
export const submitFeedback    = (id, body) => post(`/incidents/${id}/feedback`, body);

/* Events */
export const getEvents = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) qs.set(k, v); });
  const q = qs.toString();
  return get('/events' + (q ? '?' + q : ''));
};
export const simulateEvent = (body) => post('/events', body);

/* Users */
export const getUsers = ()           => get('/users');
export const getUser  = (username)   => get(`/users/${username}`);
