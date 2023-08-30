export function isExternal(path: string) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

export function uuid() {
  const s: any[] = []
  const hexDigits = '0123456789abcdef'
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.slice(Math.max(0, Math.floor(Math.random() * 0x10)))[0]
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.slice(Math.max(0, (s[19] & 0x3) | 0x8))[0] // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'
  return s.join('')
}

export function randomString(length: number) {
  const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = length; i > 0; --i) {
    result += str[Math.floor(Math.random() * str.length)]
  }
  return result
}

export function datetimeDisplay(d: Date): string {
  const dd = new Date(d)
  const ddFormat = `${[dd.getDate(), dd.getMonth() + 1, dd.getFullYear()].join('/')} ${[
    dd.getHours(),
    dd.getMinutes(),
    dd.getSeconds(),
  ].join(':')}`
  return ddFormat
}

/**
 * 中划线字符驼峰
 * @param {*} str 要转换的字符串
 * @returns 返回值
 */
export function toHump(str: string): string {
  if (!str) return str
  return str
    .replace(/-(\w)/g, (all, letter) => {
      return letter.toUpperCase()
    })
    .replace(/(\s|^)[a-z]/g, char => {
      return char.toUpperCase()
    })
}

export function isEmpty(val: string): boolean {
  if (val === undefined || typeof val !== 'string') {
    return true
  }
  return val === null || val.trim().length === 0
}

export const $utils = {
  isExternal,
  uuid,
  randomString,
  toHump,
  isEmpty,
  datetimeDisplay,
}
