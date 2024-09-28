const Client = require('@veryfi/veryfi-sdk')
const path = require('path')

const CLIENT_ID = process.env.VERYFI_CLIENT_ID
const CLIENT_SECRET = process.env.VERYFI_CLIENT_SECRET
const USERNAME = process.env.VERYFI_USERNAME
const API_KEY = process.env.VERYFI_API_KEY

let my_client = new Client(CLIENT_ID, CLIENT_SECRET, USERNAME, API_KEY)

class OCRService {
  static async processImage(file) {
    const filePath = path.join(__dirname, `../uploads/${file.fileName}`)
    try {
      const receipt = await my_client.process_document(filePath)
      const { img_url, category, currency_code, date, total } = receipt
      return {
        img_url,
        title: category,
        createdAt: new Date(date).toISOString(),
        total,
      }
    } catch (error) {
      console.error('🚀 ~ OCRService ~ processImage ~ error:', error)
      throw new InternalServerError('Scan receipt error')
    }
  }
}

module.exports = OCRService
