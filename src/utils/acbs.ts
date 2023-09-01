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
  const slat = import.meta.env.VITE_ACBS_AES_KEY // hide in javascript (index.*.js) at https://macaoapply.singlewindow.gd.cn

  const hashValue = CryptoJS.AES.encrypt(
    CryptoJS.enc.Utf8.parse(pw),
    CryptoJS.enc.Utf8.parse(slat),
    {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    },
  ).ciphertext.toString()
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Hex.parse(hashValue))
}
