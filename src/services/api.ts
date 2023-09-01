import request from '@/utils/request'

const proxyHost = import.meta.env.VITE_APP_PROXY_HOST ?? '/'
const directHost = 'https://macaoapply.singlewindow.gd.cn/'

export function sendApplyNotify(params: any): Promise<any> {
  return request<any>('/tool/send_apply_notify', {
    params,
    method: 'POST',
  })
}

export function getVerifyCode(params: any): Promise<any> {
  let apiMethod = localStorage.getItem('apiMethod') ?? 'proxy'
  return request<any>(
    `before/sys/verifyCode/getLoginVerifyCode`,
    {
      params,
      method: 'GET',
    },
    apiMethod === 'proxy' ? proxyHost : directHost,
  )
}

export function getLogin(params: any): Promise<any> {
  let apiMethod = localStorage.getItem('apiMethod') ?? 'proxy'
  return request<any>(
    `before/login`,
    {
      params,
      method: 'POST',
      options: {
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      },
    },
    apiMethod === 'proxy' ? proxyHost : directHost,
  )
}

export function getAppointmentDate(params: any, token: string): Promise<any> {
  let apiMethod = localStorage.getItem('apiMethod') ?? 'proxy'
  return request<any>(
    `before/sys/appointment/getAppointmentDate`,
    {
      params,
      method: 'POST',
      options: {
        headers: { 'content-type': 'application/x-www-form-urlencoded', 'X-Access-Token': token },
      },
    },
    apiMethod === 'proxy' ? proxyHost : directHost,
  )
}
