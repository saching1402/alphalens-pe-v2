import axios from 'axios'
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '', headers: { 'Content-Type': 'application/json' } })
export const getDashboard = () => API.get('/api/dashboard/').then(r => r.data)
export const getManagers = (p) => API.get('/api/managers/', { params: p }).then(r => r.data)
export const getManager = (id) => API.get(`/api/managers/${id}/`).then(r => r.data)
export const getTop = (p) => API.get('/api/top/', { params: p }).then(r => r.data)
export const getScatter = (p) => API.get('/api/scatter/', { params: p }).then(r => r.data)
export const getQuartile = (p) => API.get('/api/quartile/', { params: p }).then(r => r.data)
export const importFile = (file) => { const f = new FormData(); f.append('file', file); return API.post('/api/import/', f, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data) }
