'use strict';

const assert = require('chai').assert;
const chrome = require('selenium-webdriver/chrome');
const http = require('http');
const nodeStatic = require('node-static');
const axeTestUrls = require('../lib/axe-test-urls');
const { startDriver } = require('../lib/webdriver');

describe('integrations', function () {
  let program, urls, server;

  before(function () {
    // Start a server
    const file = new nodeStatic.Server('.');
    server = http.createServer(function (request, response) {
      request
        .addListener('end', function () {
          file.serve(request, response);
        })
        .resume();
    });
    server.listen(8182);
  });

  after(function () {
    server.close();
  });

  beforeEach(async function () {
    program = {
      browser: 'chrome-headless'
    };
    await startDriver(program);
    urls = ['http://localhost:8182/test/testpage.html'];
  });

  afterEach(async () => {
    await program.driver.quit();
    // adds a 100 ms wait to allow the service to stop
    await new Promise(resolve => setTimeout(resolve, 100));
    const service = chrome.getDefaultService();
    if (service.isRunning()) {
      await service.stop();

      // An unfortunately hacky way to clean up
      // the service. Stop will shut it down,
      // but it doesn't reset the local state
      service.address_ = null;
      chrome.setDefaultService(null);
    }
  });

  it('finds results in light and shadow DOM', async () => {
    let listResult;
    await axeTestUrls(urls, program, {
      onTestComplete: function (results) {
        assert.containsAllKeys(results, [
          'testEngine',
          'testEnvironment',
          'testRunner'
        ]);
        listResult = results.violations.find(result => result.id === 'list');
        assert.lengthOf(listResult.nodes, 2);
        assert.deepEqual(listResult.nodes[0].target, ['#list']);
        assert.deepEqual(listResult.nodes[1].target, [
          ['#shadow-root', '#shadow-list']
        ]);
      }
    });

    assert.isDefined(listResult);
  });
});
