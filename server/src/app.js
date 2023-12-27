const express = require('express')
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');

const api = require('./routes/api')

const app = express()

// 日志记录位置尽量 早 
app.use(morgan('combined'))

app.use(cors({
    origin: 'http://localhost:3000',
  }));

app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))

app.use('/v1', api)

// 确保第一页打开就是 index.html 内容
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '..','public','index.html'));
} )

module.exports = app