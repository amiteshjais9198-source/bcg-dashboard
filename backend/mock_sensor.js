// mock_sensor.js
// Simulates the Python script pushing data to POST /api/vitals
const http = require('http');

let heartRate = 72;
let hrv = 45;

setInterval(() => {
  heartRate += Math.floor(Math.random() * 5) - 2;
  hrv += Math.floor(Math.random() * 5) - 2;
  
  if (heartRate < 60) heartRate = 60;
  if (heartRate > 100) heartRate = 100;
  if (hrv < 35) hrv = 35;
  if (hrv > 70) hrv = 70;

  const amplitude = (Math.sin(Date.now() / 1000) * 0.5 + 0.5).toFixed(2);
  const riskStatus = Math.random() > 0.95 ? 1 : 0; // 5% chance of risk

  const data = JSON.stringify({
    heartRate,
    hrv,
    amplitude: parseFloat(amplitude),
    riskStatus
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/vitals',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    // console.log(`STATUS: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error(error);
  });

  req.write(data);
  req.end();

}, 1000); // 1Hz
