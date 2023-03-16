const path = require('path');
const os = require("os");

/**
 * @see https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#could-not-find-expected-browser-locally
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: path.join(os.homedir(), '.cache', 'puppeteer')
};