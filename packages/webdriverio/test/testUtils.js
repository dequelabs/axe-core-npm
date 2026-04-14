'use strict';

const net = require('net');
const path = require('path');
const os = require('os');
const { config } = require('dotenv');

const getFreePort = () => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(err => {
        if (err) reject(err);
        else resolve(port);
      });
    });
    server.once('error', reject);
  });
};

const connectToChromeDriver = (port, retries = 10, interval = 200) => {
  const attempt = () => {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: 'localhost', port }, () => {
        socket.destroy();
        resolve();
      });
      socket.once('error', err => {
        socket.destroy();
        reject(err);
      });
    });
  };

  const retry = remaining => {
    return attempt().catch(err => {
      if (remaining <= 0) {
        throw new Error(`Unable to connect to ChromeDriver: ${err.message}`);
      }
      return new Promise(resolve => setTimeout(resolve, interval)).then(() =>
        retry(remaining - 1)
      );
    });
  };

  return retry(retries);
};

const loadBdmEnv = () => {
  const bdmCacheDir = path.resolve(os.homedir(), '.browser-driver-manager');
  config({ path: path.resolve(bdmCacheDir, '.env') });
};

module.exports = { getFreePort, connectToChromeDriver, loadBdmEnv };
