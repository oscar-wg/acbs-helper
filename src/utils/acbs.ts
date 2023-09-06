import CryptoJS from 'crypto-js'
import jwt from '../utils/jwt'

export const getAcbsJwt = (payload: object) => {
  const secret = import.meta.env.VITE_ACBS_JWT_SECRET // from localStorage (dKey) at https://macaoapply.singlewindow.gd.cn
  const defaultPayload = {
    issType: 'web',
    appType: 'web',
  }
  payload = {
    ...payload,
    ...defaultPayload,
  }
  return jwt.encode(payload, secret, 'SHA256')
}

export const getAcbsPwHash = (pw: string) => {
  const key = import.meta.env.VITE_ACBS_AES_KEY // hide in javascript (index.*.js) at https://macaoapply.singlewindow.gd.cn
  var encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(pw), CryptoJS.enc.Utf8.parse(key), {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
    iv: '',
  })
  return encrypted.toString()
}
