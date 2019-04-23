const app = require('./webhook')

const PORT = process.env.PORT || 3000

app.listen(PORT)
console.info(`Listening Port ${PORT}`)