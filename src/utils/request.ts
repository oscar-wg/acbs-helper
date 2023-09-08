import axios from 'axios'
import { showNotify } from 'vant'

axios.defaults.timeout = 5 * 60 * 1000

const directHost = 'https://macaoapply.singlewindow.gd.cn'
const defaultProxyHost = import.meta.env.VITE_APP_PROXY_HOST ?? ''
const helperApiHost = import.meta.env.VITE_APP_API_HOST ?? ''

const instance = axios.create()

instance.interceptors.request.use(
  config => {
    if (config.url?.includes('before/')) {
      let apiMethod = localStorage.getItem('apiMethod') ?? 'direct'
      let host = directHost
      if (apiMethod === 'proxy') {
        host = defaultProxyHost !== '' ? defaultProxyHost : localStorage.getItem('proxyHost')
      }
      config.baseURL = host
    } else {
      config.baseURL = helperApiHost
    }
    const token = localStorage.getItem('token') ?? null
    if (token !== null) {
      config.headers['X-Access-Token'] = token
    }
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
      showNotify({ type: 'danger', message: `[Chrome] ${err.message}, 請查看"說明"` })
    } else if (err.code === 'ERR_BAD_RESPONSE') {
      showNotify({
        type: 'danger',
        message: `[${err.response.status}] ${err.response.statusText}"`,
      })
    }
    console.log(err)
    return Promise.reject(err)
  },
)

export function request<T>(
  url: string,
  { method = 'GET', params = {}, options = {} } = {},
  baseURL: string = '',
): Promise<T> {
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
