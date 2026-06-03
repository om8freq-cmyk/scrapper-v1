const http = require('http');

console.log("Sending GET request to http://localhost:3000/leads...");

http.get('http://localhost:3000/leads', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`Response Status: ${res.statusCode}`);
    console.log("Response Body:", data);
  });
}).on('error', (err) => {
  console.error("API request failed:", err.message);
});
