const express = require('express');
const aiRoutes = require('./routes/ai.routes')
const gitRoutes = require('./routes/git.routes')
const cors = require('cors')

const app = express()

app.use(cors())


app.use(express.json())

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.use('/ai', aiRoutes)
app.use('/git', gitRoutes)

module.exports = app
