import axios from 'axios'
import { showNotify } from 'vant'

const instance = axios.create({
  timeout: 60_000,
})

instance.interceptors.request.use(
  config => {
    return config
  },
  err => {
    return Promise.reject(err)
  },
)

instance.interceptors.response.use(
  res => {
    return res.data
  },
  err => {
    if (err.code === 'ERR_NETWORK') {
      showNotify({ type: 'danger', message: `[Chrome] ${err.message}` })
      console.log(err)
    }
    return Promise.reject(err)
  },
)

export function request<T>(
  url: string,
  { method = 'GET', params = {}, options = {} } = {},
  baseURL: string = '',
): Promise<T> {
  instance.defaults.baseURL =
    baseURL !== '' ? baseURL : import.meta.env.VITE_APP_NOTIFY_API_HOST ?? '/'
  method = method.toUpperCase()

  switch (method) {
    case 'GET':
      return instance.get(url, { params, ...options })

    case 'POST':
      return instance.post(url, params, options)

    case 'DELETE':
      return instance.delete(url, { params, ...options })

    case 'PUT':
      return instance.put(url, params, options)

    default:
      return Promise.reject(new Error(`Unknown request method: ${method}`))
  }
}

export default request
