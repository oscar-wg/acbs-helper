import { PNG } from 'pngjs/browser'
import Tesseract from 'tesseract.js'
import gifFrames from './gif-frames'

const initWorker = async () => {
  const worker = await Tesseract.createWorker()
  await worker.loadLanguage('eng')
  await worker.initialize('eng')
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  })
  return worker
}

let worker: any = null

async function getBufferFromDataURL(dataUrl: string) {
  const request = await fetch(dataUrl)
  const response = await request.arrayBuffer()
  return Buffer.from(response)
}

const colorInRange = (rgb: number[], start: number[], end: number[] = []) => {
  if (end.length === 0) {
    end = start
  }
  for (let r = start[0]; r <= end[0]; r++) {
    for (let g = start[1]; g <= end[1]; g++) {
      for (let b = start[2]; b <= end[2]; b++) {
        if (rgb[0] === r && rgb[1] === g && rgb[2] === b) {
          return true
        }
      }
    }
  }
  return false
}

export const pngVerifyCodeImgFilter = async (imgSrc: string) => {
  const imageBuffer = await getBufferFromDataURL(imgSrc)
  const pngImage = PNG.sync.read(imageBuffer)
  let { height, width } = pngImage
  let imgData = pngImage.data
  for (let y = 0; y < height; y++) {
    // rows
    for (let x = 0; x < width; x++) {
      // columns
      let index = (width * y + x) * 4
      let rgb = [imgData[index], imgData[index + 1], imgData[index + 2]]
      if (rgb[0] === 255 && rgb[1] === 255 && rgb[2] === 255) continue
      if (colorInRange(rgb, [0, 0, 0], [15, 15, 15])) {
        imgData[index] = 255
        imgData[index + 1] = 255
        imgData[index + 2] = 255
      }
      for (let temp = 15; temp <= 35; temp++) {
        if (colorInRange(rgb, [temp, temp, temp], [temp + 3, temp + 3, temp + 3])) {
          imgData[index] = 255
          imgData[index + 1] = 255
          imgData[index + 2] = 255
        }
      }
      if (colorInRange(rgb, [170, 170, 170], [205, 205, 205])) {
        imgData[index] = 255
        imgData[index + 1] = 255
        imgData[index + 2] = 255
      }
      for (let temp = 140; temp <= 170; temp++) {
        if (colorInRange(rgb, [temp, temp, temp], [temp + 3, temp + 3, temp + 3])) {
          imgData[index] = 255
          imgData[index + 1] = 255
          imgData[index + 2] = 255
        }
      }

      if (colorInRange(rgb, [110, 110, 110], [135, 135, 135])) {
        imgData[index] = 255
        imgData[index + 1] = 255
        imgData[index + 2] = 255
      }

      /*
      if (
        (Math.abs(RGB[0] - RGB[1]) <= 10 &&
          Math.abs(RGB[1] - RGB[2]) <= 10 &&
          RGB[0] >= 185 &&
          RGB[1] <= 200) ||
        (RGB[0] === 0 && RGB[1] === 0 && RGB[2] === 0)
      ) {
        imgData[index] = 255
        imgData[index + 1] = 255
        imgData[index + 2] = 255
      } else if (
        Math.abs(RGB[0] - RGB[1]) <= 5 &&
        Math.abs(RGB[1] - RGB[2]) <= 5 &&
        RGB[0] >= 125 &&
        RGB[1] <= 135
      ) {
        if (y > 0) {
          const upperIndex = (width * (y - 1) + x) * 4
          const upperRGB = [imgData[upperIndex], imgData[upperIndex + 1], imgData[upperIndex + 2]]
          if (!(upperRGB[0] === 255 && upperRGB[1] === 255 && upperRGB[2] === 255)) {
            imgData[index] = 0
            imgData[index + 1] = 0
            imgData[index + 2] = 0
            continue
          }
        }
        imgData[index] = 255
        imgData[index + 1] = 255
        imgData[index + 2] = 255
      } else {
        imgData[index] = 0
        imgData[index + 1] = 0
        imgData[index + 2] = 0
      }
      */
    }
  }

  const newImageBuffer = PNG.sync.write(pngImage)
  return `data:image/png;base64,${newImageBuffer.toString('base64')}`
}

export const parseVerifyCode = async (imgSrc: string, callback: Function = () => {}) => {
  if (worker === null) {
    worker = await initWorker()
  }
  if (imgSrc.includes('image/png')) {
    const newImageSrc = pngVerifyCodeImgFilter(imgSrc)
    const answer = await worker
      .recognize(newImageSrc)
      .then((data: any) => {
        return data.data.text.replace(' ', '').replace('\n', '')
      })
      .catch((err: any) => {
        console.log(err)
        return ''
      })
    callback(answer)
  } else if (imgSrc.includes('image/gif')) {
    // old method to GIF image
    const verifyCodeAnswerArray: any[] = []
    gifFrames({ url: imgSrc, frames: 'all', outputType: 'canvas' })
      .then(async (frameData: any) => {
        for (const fd of frameData) {
          const newImageSrc = pngVerifyCodeImgFilter(fd.getImage().toDataURL('image/png'))

          const answer = await worker
            .recognize(newImageSrc)
            .then((data: any) => {
              return data.data.text.replace(' ', '').replace('\n', '')
            })
            .catch((err: any) => {
              console.log(err)
              return ''
            })

          if (verifyCodeAnswerArray.filter(r => r.key === answer).length === 0) {
            verifyCodeAnswerArray.push({
              key: answer,
              count: 1,
            })
          } else {
            verifyCodeAnswerArray.forEach(r => {
              if (r.key === answer) {
                r.count++
              }
            })
          }
        }
        console.log(verifyCodeAnswerArray)
        const answer = verifyCodeAnswerArray.reduce(
          (cv: any, r: any) =>
            (r.key.length === 4 && r.count > cv.count) || cv.key.length !== 4 ? r : cv,
          verifyCodeAnswerArray[0],
        ).key
        callback(answer)
      })
      .catch((e: any) => {
        console.log(e)
        return ''
      })
  } else {
    console.log('verify code image not support.')
    callback('')
  }
}
