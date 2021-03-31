#!/usr/bin/env node

// as program 😎:
// $ chmod 755 node-file-server.js
// run with:
// $ ./node-file-server.js

// *****************************************************
// simplest server serving static files using only node
// *****************************************************
// 
// Based on:
// https://adrianmejia.com/building-a-node-js-static-file-server-files-over-http-using-es6/
// 
// Running:
// $ node node-file-server.js
//
// Try with:
// $ curl --path-as-is http://localhost:9000/../fileInDanger.txt



const http = require('http')
const util = require('util')
// const url  = require('url')
const fs   = require('fs')
const path = require('path')


// Deciding port: 9000 or valid defined 
// at command line

const port = parseInt(process.argv[2]) || 9000
const basePath = path.normalize(process.cwd())

// maps file extention to MIME types
// full list can be found here: https://www.freeformatter.com/mime-types-list.html
const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.eot': 'application/vnd.ms-fontobject',
  '.ttf': 'application/x-font-ttf',
}

const server = http.createServer(
  (req, res) => {
    console.log(`Server log: method: ${req.method}, url: ${req.url}`)

    // parse url
    // const parsedPath = new url.URL(req.url).pathname
    const parsedPath = req.url
    // const askedPath = removePathRelativeSpecifiers(parsedPath)
    const askedPath = path.normalize(path.join(basePath, parsedPath))
    console.log(`Server log: joined normalized path is: ${askedPath}`)
    const askedPathStartsWithBase = askedPath.startsWith(basePath)


    if(!askedPathStartsWithBase) {
      returnForbidden(res, parsedPath)
      return;
    }


    fs.stat(askedPath, (err, stats) => {
      if(err) {
        returnNotFound(res, parsedPath)
        return;
      }
      else {
        if(stats.isDirectory()) {
          returnDirectory(res, askedPath,basePath)
          return;
        }
        else if(stats.isFile()) {
          fs.readFile(askedPath, (err, data) => {
            if(err) {
              returnReadingError(res, parsedPath, err)
            }
            else {
              addFileCorsRules(res)
              returnFileWithMime(res, askedPath, data)
            }
          })
          return;
        }
        else {
          returnForbidden(res, parsedPath)
          return;
        }
      }
    })

    // // removes relative elements from path string
    // function removePathRelativeSpecifiers(s) {
    //   // '/../yoyo/../koko'
    //   //   .replace(/[\/\\]\.\.[\/\\]/g, '/')
    //   //   .replace(/^[\/\\]/,'')
    //   // === 'yoyo/koko'
    //   return s.replace(/[\/\\]\.\.[\/\\]/g, '/').replace(/^[\/\\]/,'')
    // }

    function returnForbidden(res, parsedPath) {
      res.statusCode = 403
      res.end(`You have not access rights to file ${parsedPath}\n`)
    }

    function returnNotFound(res, parsedPath) {
      res.statusCode = 404
      res.end(`File ${parsedPath} not found!\n`)
    }

    function returnReadingError(res, parsedPath, err) {
      res.statusCode = 500
      res.end(`Error getting the file: ${parsedPath}.\n${err}\n`)
    }

    function returnFileWithMime(res, askedPath, data) {
      const ext = path.extname(askedPath)
      res.setHeader('Content-type', mimeType[ext] || 'text/plain')
      res.end(data)
    }
    
    function returnDirectory(res, askedPath, basePath) {
      const directoryName = askedPath.substr(basePath.length)
      res.statusCode = 200
      res.end(`${directoryName} is directory.\n`)
    }


    // see: https://stackoverflow.com/questions/25761481/simple-ajax-request-to-localhost-nodejs-server/28089807#28089807
    // see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    //
    function addFileCorsRules(res) {
      // served file will allow accessing files from other origins:
      res.setHeader('Access-Control-Allow-Origin', '*')
      // using following methods:
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
      // with following headers:
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
      // and allowed cookies
      res.setHeader('Access-Control-Allow-Credentials', true)

    }

  }
).listen(port)


console.log(`Console: ***********************************`)
console.log(`Console: This is static file server in node.`)
console.log(`Console: ***********************************`)
console.log(``)
console.log(`Console: It serves files under its cwd.`)
console.log(`Console: For common file extensions appriopriate mime is used.`)
console.log(`Console: For unknown file extensions text/plain mime is used.`)
console.log(`Console: Successful response with file adds unrestrictive CORS headers.`)
console.log(``)
console.log(`Console: Server base path is ${basePath}`)
console.log(``)
console.log(`Console: Server is: ${util.inspect(server.address())}`)
console.log(``)
console.log(`Console: to stop server hit <ctrl> + c`)
