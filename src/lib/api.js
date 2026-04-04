import axios from 'axios'

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  withCredentials: true,
  timeout:         15000,
})

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('qrownd_access')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})

let refreshing = false, queue = []
const flush = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = [] }

api.interceptors.response.use(r => r, async err => {
  const orig = err.config
  if (err.response?.status === 401 && !orig._retry) {
    if (refreshing) return new Promise((res, rej) => queue.push({ resolve:res, reject:rej })).then(t => { orig.headers.Authorization=`Bearer ${t}`; return api(orig) })
    orig._retry = true; refreshing = true
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
      const { data } = await axios.post(`${base}/auth/refresh`, {}, { withCredentials:true })
      const nt = data.data.accessToken
      localStorage.setItem('qrownd_access', nt)
      flush(null, nt)
      orig.headers.Authorization = `Bearer ${nt}`
      return api(orig)
    } catch(re) {
      flush(re, null)
      localStorage.removeItem('qrownd_access'); localStorage.removeItem('qrownd_user')
      window.location.href = '/login'
      return Promise.reject(re)
    } finally { refreshing = false }
  }
  return Promise.reject(err)
})

export default api
