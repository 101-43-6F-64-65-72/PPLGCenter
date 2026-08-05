const http = require('http');

const loginData = JSON.stringify({
  email: 'admin@studentcenter.id',
  password: 'Admin123!'
});

const req = http.request({
  hostname: 'localhost',
  port: 5051,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("=== RESPONSE LOGIN ===");
    console.log("Status:", res.statusCode);
    console.log("Body:", data);
    
    try {
      const parsed = JSON.parse(data);
      const token = parsed.data?.token;
      if (token) {
        fetchProfile(token);
      }
    } catch(e) {}
  });
});

req.write(loginData);
req.end();

function fetchProfile(token) {
  const req2 = http.request({
    hostname: 'localhost',
    port: 5051,
    path: '/api/auth/me',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log("=== RESPONSE AUTH/ME ===");
      console.log("Status:", res.statusCode);
      console.log("Body:", data);
    });
  });
  req2.end();
}
