const express = require('express');
const os = require('os');
const https = require('https');
const { promisify } = require('util');
const ipInfo = require('ipinfo');

const app = express();

// Function to get the local IPv4 address
function getLocalIpv4Address() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Default to localhost if no external IPv4 is found
}

// Promisify the https.get to work with async/await
const getPublicIpv4Address = promisify((callback) => {
    https.get('https://api.ipify.org?format=json', (resp) => {
        let data = '';

        resp.on('data', (chunk) => {
            data += chunk;
        });

        resp.on('end', () => {
            const { ip } = JSON.parse(data);
            callback(null, ip);
        });
    }).on('error', (err) => {
        callback(err, null);
    });
});

app.get('/', async (req, res) => {
    try {
        const ipv4Address = getLocalIpv4Address(); // Local IPv4 address
        const publicIp = await getPublicIpv4Address(); // Public IPv4 address

        ipInfo(publicIp, (err, info) => {
            if (err) {
                console.error('Error fetching IP info:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to retrieve IP information',
                    error: err.message,
                });
            }

            // Respond with IP information
            return res.status(200).json({
                success: true,
                ipv4Address,
                publicIp,
                ipInternalInfo: info,
            });
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching public IP',
            error: err.message,
        });
    }
});

app.listen(8120, () => console.log('Server is running on port 8120'));
