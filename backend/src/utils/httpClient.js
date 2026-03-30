const https = require('https');

function requestJson({ hostname, path, method = 'GET', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path, method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: res.statusCode || 500, data: parsed });
        } catch (err) {
          reject(new Error(`Invalid JSON response from ${hostname}${path}`));
        }
      });
    });

    req.on('error', reject);

    if (body) req.write(body);
    req.end();
  });
}

module.exports = {
  requestJson
};
