import request from '@/utils/request'

const defaultProxyHost = import.meta.env.VITE_APP_PROXY_HOST ?? ''
const directHost = 'https://macaoapply.singlewindow.gd.cn/'

export function sendApplyNotify(params: any): Promise<any> {
  return request<any>('/tool/send_apply_notify', {
    params,
    method: 'POST',
  })
}

export function solveSliderCaptcha(params: any): Promise<any> {
  return request<any>('/tool/solve-slider-captcha', {
    params,
    method: 'POST',
  })
}

export function solveImageCaptcha(params: any): Promise<any> {
  return request<any>('/tool/solve-image-captcha', {
    params,
    method: 'POST',
  })
}

const acbsPost = (url: string, params: any): Promise<any> => {
  return request<any>(url, {
    params,
    method: 'POST',
    options: {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
  })
}

const acbsGet = (url: string, params: any): Promise<any> => {
  return request<any>(url, {
    params,
    method: 'GET',
    options: {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
  })
}

export function getVerifyCode(params: any): Promise<any> {
  return acbsGet(`before/sys/verifyCode/getLoginVerifyCode`, params)
}

export function getLogin(params: any): Promise<any> {
  return acbsPost(`before/login`, params)
}

export function getAppointmentDate(params: any): Promise<any> {
  return acbsPost(`before/sys/appointment/getAppointmentDate`, params)
}

export function getVehicleInfo(params: any): Promise<any> {
  return acbsPost(`before/sys/appointment/getPassQualification`, params)
}

export async function getVerifySlider(params: any): Promise<any> {
  return acbsGet(`before/sys/captcha/getPassBookingVerifyComplexImage`, params)
}

export function checkPassBookingVerify(params: any): Promise<any> {
  return acbsPost(`before/sys/captcha/checkPassBookingComplexImage`, params)
}

export function validationPassBooking(params: any): Promise<any> {
  return acbsPost(`before/sys/appointment/validationPassBooking`, params)
}

export function createPassAppointment(params: any): Promise<any> {
  return acbsPost(`before/sys/appointment/createPassAppointment`, params)
}
