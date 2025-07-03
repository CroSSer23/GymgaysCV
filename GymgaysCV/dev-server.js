const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Простий MIME type mapping
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Імпорт API обробників
let chatAPI = null;
try {
  chatAPI = require('./api/chat.js');
} catch (error) {
  console.log('⚠️ Chat API not available');
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API маршрути
  if (pathname.startsWith('/api/') && chatAPI) {
    try {
      // Збираємо body для POST запитів
      if (req.method === 'POST' || req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            req.body = JSON.parse(body);
          } catch (error) {
            req.body = {};
          }
          
          // Створюємо mock відповідь
          const mockRes = {
            statusCode: 200,
            headers: {},
            setHeader: (name, value) => {
              mockRes.headers[name] = value;
            },
            status: (code) => {
              mockRes.statusCode = code;
              return mockRes;
            },
            json: (data) => {
              res.writeHead(mockRes.statusCode, {
                'Content-Type': 'application/json',
                ...mockRes.headers
              });
              res.end(JSON.stringify(data));
            }
          };

          await chatAPI(req, mockRes);
        });
        return;
      } else {
        // Створюємо mock відповідь для GET запитів
        const mockRes = {
          statusCode: 200,
          headers: {},
          setHeader: (name, value) => {
            mockRes.headers[name] = value;
          },
          status: (code) => {
            mockRes.statusCode = code;
            return mockRes;
          },
          json: (data) => {
            res.writeHead(mockRes.statusCode, {
              'Content-Type': 'application/json',
              ...mockRes.headers
            });
            res.end(JSON.stringify(data));
          }
        };

        req.query = parsedUrl.query;
        await chatAPI(req, mockRes);
        return;
      }
    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
      return;
    }
  }

  // Статичні файли
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, filePath);

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (error) {
    // Якщо файл не знайдено, повертаємо index.html (для SPA)
    if (error.code === 'ENOENT') {
      try {
        const indexData = fs.readFileSync(path.join(__dirname, 'index.html'));
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      } catch (indexError) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
    }
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Dev server running on http://localhost:${PORT}`);
  console.log(`📱 Open web chat at: http://localhost:${PORT}`);
  console.log(`🔧 API available at: http://localhost:${PORT}/api/status`);
  console.log('');
  console.log('💡 Tips:');
  console.log('   - Press Ctrl+C to stop server');
  console.log('   - Edit files and refresh browser');
  console.log('   - Check console for API logs');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down dev server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}); 