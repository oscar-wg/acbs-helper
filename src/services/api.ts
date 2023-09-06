import request from '@/utils/request'

const defaultProxyHost = import.meta.env.VITE_APP_PROXY_HOST ?? ''
const directHost = 'https://macaoapply.singlewindow.gd.cn/'

export function sendApplyNotify(params: any): Promise<any> {
  return request<any>('/tool/send_apply_notify', {
    params,
    method: 'POST',
  })
}

const acbsPost = (url: string, params: any, token: string | null = null): Promise<any> => {
  let apiMethod = localStorage.getItem('apiMethod') ?? 'direct'
  let host = directHost
  if (apiMethod === 'proxy') {
    host = defaultProxyHost !== '' ? defaultProxyHost : localStorage.getItem('proxyHost')
  }
  return request<any>(
    url,
    {
      params,
      method: 'POST',
      options: {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-Access-Token': token ?? '',
        },
      },
    },
    host,
  )
}

const acbsGet = (url: string, params: any, token: string | null = null): Promise<any> => {
  let apiMethod = localStorage.getItem('apiMethod') ?? 'proxy'
  let host = directHost
  if (apiMethod === 'proxy') {
    host = defaultProxyHost !== '' ? defaultProxyHost : localStorage.getItem('proxyHost')
  }
  return request<any>(
    url,
    {
      params,
      method: 'GET',
      options: {
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          'X-Access-Token': token ?? '',
        },
      },
    },
    host,
  )
}

export function getVerifyCode(params: any): Promise<any> {
  return acbsGet(`before/sys/verifyCode/getLoginVerifyCode`, params)
}

export function getLogin(params: any): Promise<any> {
  return acbsPost(`before/login`, params)
}

export function getAppointmentDate(params: any): Promise<any> {
  const token = localStorage.getItem('token') ?? null
  return acbsPost(`before/sys/appointment/getAppointmentDate`, params, token)
}

export function getVehicleInfo(params: any): Promise<any> {
  const token = localStorage.getItem('token') ?? null
  return acbsPost(`before/sys/appointment/getPassQualification`, params, token)
}

export async function getVerifySlider(params: any): Promise<any> {
  const token = localStorage.getItem('token') ?? null
  return acbsGet(`before/sys/captcha/getPassBookingVerifyComplexImage`, params, token)
}

export function checkPassBookingVerify(params: any): Promise<any> {
  const token = localStorage.getItem('token') ?? null
  return acbsPost(`before/sys/captcha/checkPassBookingComplexImage`, params, token)
}

export function validationPassBooking(params: any): Promise<any> {
  const token = localStorage.getItem('token') ?? null
  return acbsPost(`before/sys/appointment/validationPassBooking`, params, token)
}

export function createPassAppointment(params: any): Promise<any> {
  const token = localStorage.getItem('token') ?? null
  return acbsPost(`before/sys/appointment/createPassAppointment`, params, token)
}
