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

const connectToChromeDriver = port => {
  let socket;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error('Unable to connect to ChromeDriver'));
    }, 1000);
    socket = net.createConnection({ host: 'localhost', port }, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve();
    });
    socket.once('error', err => {
      clearTimeout(timer);
      socket.destroy();
      reject(err);
    });
  });
};

const loadBdmEnv = () => {
  const bdmCacheDir = path.resolve(os.homedir(), '.browser-driver-manager');
  config({ path: path.resolve(bdmCacheDir, '.env') });
};

module.exports = { getFreePort, connectToChromeDriver, loadBdmEnv };
