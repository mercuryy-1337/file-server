const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const path = require("path")
const fs = require("fs")

const port = Number.parseInt(process.env.PORT || "3000", 10)
const dev = process.env.NODE_ENV !== "production"

// init
const app = next({ dev, dir: __dirname })
const handle = app.getRequestHandler()

// MIME type mapping
const mimeTypes = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    const { pathname } = parsedUrl

    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")

    // Handle OPTIONS requests for CORS preflight
    if (req.method === "OPTIONS") {
      res.writeHead(200)
      res.end()
      return
    }

    // Handle static files with proper MIME types
    if (pathname.startsWith("/_next/static/")) {
      const filePath = path.join(__dirname, pathname)
      const ext = path.extname(filePath).toLowerCase()

      // Set proper content type based on file extension
      if (mimeTypes[ext]) {
        res.setHeader("Content-Type", mimeTypes[ext])
      }

      // Add cache control headers for static assets
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable")
    }

    // Add cache control headers for API routes
    if (pathname.startsWith("/api/")) {
      res.setHeader("Cache-Control", "no-store, max-age=0")
      res.setHeader("Pragma", "no-cache")
    }

    handle(req, res, parsedUrl)
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})
