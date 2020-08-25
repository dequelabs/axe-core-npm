const path = require('path');
const execa = require('execa');

const CLI = path.resolve(__dirname, '../', 'axe-cli');

const runCLI = async (...args) => {
  const result = await execa(CLI, [...args]);
  return result;
};

module.exports = { runCLI };
