const app = require('./src/app')
const {
  app: { port },
} = require('./src/configs/mongodb.config')
const PORT = port || 5000

const server = app.listen(PORT, () => {
  console.log(`Server start with port ${PORT}`)
})

process.on('SIGINT', () => {
  server.close(() => console.log(`Exit server express`))
})


module.exports = server