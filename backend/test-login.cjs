const http = require('http');

async function testLogin() {
  const { authenticator } = require('otplib');
  const token = authenticator.generate('JBSWY3DPEHPK3PXP');

  console.log('Testing CEO login with 2FA code:', token);

  const data = JSON.stringify({
    email: 'julius@jn-automation.de',
    password: 'CEO@12345',
    twoFactorCode: token
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/ceo-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body);
        resolve(JSON.parse(body));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

testLogin().catch(console.error);
