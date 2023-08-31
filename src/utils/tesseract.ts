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

let worker:any = null

async function getBufferFromDataURL(dataUrl: string) {
  const request = await fetch(dataUrl)
  const response = await request.arrayBuffer()
  return Buffer.from(response)
}

function pngVerifyCodeImgFilter(imageBuffer: any) {
  const pngImage = PNG.sync.read(imageBuffer)
  let { height, width } = pngImage
  let imgData = pngImage.data

  for (let y = 0; y < height; y++) {  // rows
    for (let x = 0; x < width; x++) {   // columns
      let index = (width * y + x) * 4;
      let RGB = [imgData[index], imgData[index+1], imgData[index+2]]
      if (RGB[0] === 255 && RGB[1] === 255 && RGB[2] === 255) continue
      if (((Math.abs(RGB[0] - RGB[1]) <= 10 && Math.abs(RGB[1] - RGB[2]) <= 10) && RGB[0] >=185 && RGB[1] <= 200) || (RGB[0] === 0 && RGB[1] === 0 && RGB[2] === 0)) {
        imgData[index] = 255; imgData[index + 1] = 255; imgData[index + 2] = 255;
      }
      else if ((Math.abs(RGB[0] - RGB[1]) <= 5 && Math.abs(RGB[1] - RGB[2]) <= 5) && RGB[0] >=125 && RGB[1] <= 135) {
        if (y > 0) {
          const upperIndex = (width * (y - 1) + x) * 4;
          const upperRGB = [imgData[upperIndex], imgData[upperIndex+1], imgData[upperIndex+2]]
          if (!((upperRGB[0] === 255 && upperRGB[1] === 255 && upperRGB[2] === 255))) {
            imgData[index] = 0; imgData[index + 1] = 0; imgData[index + 2] = 0;
            continue;
          }
        }
        imgData[index] = 255; imgData[index + 1] = 255; imgData[index + 2] = 255;
      }
      else {
        imgData[index] = 0; imgData[index + 1] = 0; imgData[index + 2] = 0;
      }
    }
  }

  const newImageBuffer = PNG.sync.write(pngImage)
  return `data:image/png;base64,${newImageBuffer.toString('base64')}`
}

export const parseVerifyCode = async (imgSrc: string, callback:Function=() => {}) => {
  if (worker === null) {
    worker = await initWorker()
  }
  if (imgSrc.includes('image/png')) {
    const imgBuffer = getBufferFromDataURL(imgSrc)
    const newImageSrc = pngVerifyCodeImgFilter(imgBuffer)
    const answer = await worker.recognize(newImageSrc)
      .then((data : any) => {
        return data.data.text.replace(' ', '').replace('\n', '')
      }).catch((err: any) => {
        console.log(err)
        return ''
      })
    callback(answer)
  }
  else if (imgSrc.includes('image/gif')) {
    const verifyCodeAnswerArray: any[] = []
    gifFrames({ url: imgSrc, frames: 'all', outputType: 'canvas' })
    .then(async (frameData: any) => {
      for (const fd of frameData) {
        const imgBuffer = getBufferFromDataURL(fd.getImage().toDataURL('image/png'))
        const newImageSrc = pngVerifyCodeImgFilter(imgBuffer)

        const answer = await worker.recognize(newImageSrc)
          .then((data : any) => {
            return data.data.text.replace(' ', '').replace('\n', '')
          }).catch((err: any) => {
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
      const answer = verifyCodeAnswerArray.reduce((cv: any, r: any) => r.key.length === 4 && r.count > cv.count || cv.key.length !== 4 ? r : cv, verifyCodeAnswerArray[0]).key
      callback(answer)
    }).catch((e: any) => {
      console.log(e)
      return ''
    })
  }
  else {
    console.log('verify code image not support.')
    callback('')
  }
}