'use strict'
const cloudinary = require('../configs/cloudinary.config')
const path = require('path')
const fs = require('fs')

// 1. upload from url image

const uploadImageFromUrl = async () => {
  try {
    const urlImage =
      'https://img-cdn.pixlr.com/image-generator/history/65bb506dcb310754719cf81f/ede935de-1138-4f66-8ed7-44bd16efc709/medium.webp'
    const folderName = 'transaction/userId',
      newFileName = 'testdemo'
    const result = await cloudinary.uploader.upload(urlImage, {
      folder: folderName,
      public_id: newFileName,
    })
    console.log(result)
    return {
      image_url: result.secure_url,
    }
  } catch (error) {
    console.error(`Error uploading image:: ${error}`)
  }
}

// 2. upload from local image

const uploadImageFromLocal = async ({ path, folderName = 'avatar/userId', fileName}) => {
  try {
   
    
    const result = await cloudinary.uploader.upload(path, {
      folder: folderName,
      public_id: fileName,
    })
    return {
      image_url: result.secure_url,
      thumb_url: await cloudinary.url(result.public_id, {
        width: 150,
        height: 159,
        format: 'jpg',
      }),
    }
  } catch (error) {
    console.error(`Error uploading image:: ${error}`)
  }
}
 
// const removeImages = async () => {
//   try {
//     let filePath = path.join(__dirname, `../uploads/`)
//     fs.rmdir(filePath, { recursive: true }, (err) => {
//       if (err) {
//         console.error(`Error removing images:: ${err}`)
//       }
//     })
//   } catch (error) {
//     console.log("🚀 ~ removeImages ~ error:", error)
    
//   }
// }

module.exports = {
  uploadImageFromLocal
}