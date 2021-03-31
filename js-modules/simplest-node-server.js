// *****************************************************
// simplest server serving static files using only node
// *****************************************************
// 
// Based on:
// https://adrianmejia.com/building-a-node-js-static-file-server-files-over-http-using-es6/
// 
// Running:
// $ node simplest-node-server.js

const http = require('http')
const util = require('util')

const server = http.createServer(
  (req, res) => {
    console.log(`Server log: method: ${req.method}, url: ${req.url}`)
    res.end('Hellow from server.')
  }
).listen(9000)


console.log(`Console: Server is: ${util.inspect(server.address())}`)
console.log(`Console: to stop server hit <ctrl>+c`)
