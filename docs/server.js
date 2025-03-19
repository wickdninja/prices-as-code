const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const STATIC_PATH = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Normalize URL to prevent directory traversal
  let url = req.url.replace(/\?.*$/, '');
  
  // Default to index.html for directory requests
  if (url.endsWith('/')) {
    url += 'index.html';
  }
  
  // Resolve the file path
  let filePath = path.join(STATIC_PATH, url);
  
  // If the path doesn't have an extension, try .html
  if (!path.extname(filePath)) {
    filePath += '.html';
  }
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read the file and serve it
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        console.error(`File not found: ${filePath}`);
        fs.readFile(path.join(STATIC_PATH, '404.html'), (err, content) => {
          if (err) {
            // No custom 404 page
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1><p>The page you are looking for does not exist.</p>');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(content);
          }
        });
      } else {
        // Server error
        console.error(`Server error: ${err.code}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Static files served from ${STATIC_PATH}`);
});