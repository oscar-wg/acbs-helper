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

export const parseVerifyCode = async (imgSrc: any, callback:Function=() => {}) => {
  if (worker === null) {
    worker = await initWorker()
  }

  const verifyCodeAnswerArray: any[] = []
  gifFrames({ url: imgSrc, frames: 'all', outputType: 'canvas' })
    .then(async (frameData: any) => {
      for (const fd of frameData) {
        const canvas = fd.getImage()
        let blobData: any = await new Promise(function(resolve, reject) {
          canvas.toBlob((blob: any) => resolve(blob))
        })
        const imageBuffer = Buffer.from(await blobData.arrayBuffer())
        const pngImage = PNG.sync.read(imageBuffer)
        let { height, width } = pngImage
        let imgData = pngImage.data

        for (let y = 0; y < height; y++) {  // rows
          for (let x = 0; x < width; x++) {   // columns
            let index = (width * y + x) * 4;
            let RGB = [imgData[index], imgData[index+1], imgData[index+2]]
            if (RGB[0] === 255 && RGB[1] === 255 && RGB[2] === 255) continue
            if (((Math.abs(RGB[0] - RGB[1]) <= 5 && Math.abs(RGB[1] - RGB[2]) <= 5) && RGB[0] >=185 && RGB[1] <= 195) || (RGB[0] === 0 && RGB[1] === 0 && RGB[2] === 0)) {
              imgData[index] = 255; imgData[index + 1] = 255; imgData[index + 2] = 255;
            } else if ((Math.abs(RGB[0] - RGB[1]) <= 5 && Math.abs(RGB[1] - RGB[2]) <= 5) && RGB[0] >=125 && RGB[1] <= 130) {
              if (y > 0) {
                const upperIndex = (width * (y - 1) + x) * 4;
                const upperRGB = [imgData[upperIndex], imgData[upperIndex+1], imgData[upperIndex+2]]
                if (!((upperRGB[0] === 255 && upperRGB[1] === 255 && upperRGB[2] === 255))) {
                  imgData[index] = 0; imgData[index + 1] = 0; imgData[index + 2] = 0;
                  continue;
                }
              }
              imgData[index] = 255; imgData[index + 1] = 255; imgData[index + 2] = 255;
            } else {
              imgData[index] = 0; imgData[index + 1] = 0; imgData[index + 2] = 0;
            }
          }
        }

        const newImageBuffer = PNG.sync.write(pngImage)
        const newImageSrc = `data:image/png;base64,${newImageBuffer.toString('base64')}`
        
        await worker.recognize(newImageSrc)
          .then((data : any) => {
            const answer = data.data.text.replace(' ', '').replace('\n', '')
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
            if (verifyCodeAnswerArray.reduce((cv: any, r: any) => cv + r.count, 0) === frameData.length) {
              console.log(verifyCodeAnswerArray)
              const answer = verifyCodeAnswerArray.reduce((cv: any, r: any) => r.key.length === 4 && r.count > cv.count || cv.key.length !== 4 ? r : cv, verifyCodeAnswerArray[0]).key
              callback(answer)
            }
          }).catch(e => {
            console.log(e)
          })
      }
    }).catch((e: any) => {
      console.log(e)
      return ''
    })
}