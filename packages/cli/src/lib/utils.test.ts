import 'mocha';
import { assert } from 'chai';
import mock = require('mock-fs');
import { dependencies } from '../../package.json';
import * as utils from './utils';

describe('utils', () => {
  describe('parseUrl', () => {
    it('given a url without protocol', () => {
      const url = 'foobar.com';
      assert.deepEqual(utils.parseUrl(url), `http://${url}`);
    });
    it('given a url with a protocol', () => {
      const url = 'http://foobar.com';
      assert.deepEqual(utils.parseUrl(url), url);
    });
  });

  describe('parseBrowser', () => {
    it('given an unknown browser returns error', () => {
      assert.throws(() => utils.parseBrowser('foobar'));
    });

    it('given no browser returns chrome-headless', () => {
      assert.deepEqual(utils.parseBrowser(), 'chrome-headless');
    });

    describe('returns firefox', () => {
      const firefoxBrowsers = ['ff', 'firefox', 'gecko', 'marionette'];
      for (const firefoxBrowser of firefoxBrowsers) {
        it(`given ${firefoxBrowser} returns firefox`, () => {
          assert.deepEqual(utils.parseBrowser(firefoxBrowser), 'firefox');
        });
      }
    });

    describe('returns chrome', () => {
      it('given chrome returns chrome', () => {
        assert.deepEqual(utils.parseBrowser('chrome'), 'chrome');
      });
    });

    describe('returns ie', () => {
      const ieBrowsers = [
        'ie',
        'explorer',
        'internetexplorer',
        'internet_explorer',
        'internet-explorer'
      ];

      for (const ieBrowser of ieBrowsers) {
        it(`given ${ieBrowser} returns ie`, () => {
          assert.deepEqual(utils.parseBrowser(ieBrowser), 'ie');
        });
      }
    });

    describe('returns safari', () => {
      it('given safari return safari', () => {
        assert.deepEqual(utils.parseBrowser('safari'), 'safari');
      });
    });

    describe('returns edge', () => {
      const edgeBrowsers = ['edge', 'microsoftedge'];
      for (const edgeBrowser of edgeBrowsers) {
        it(`given ${edgeBrowser} returns MicrosoftEdge`, () => {
          assert.deepEqual(utils.parseBrowser(edgeBrowser), 'MicrosoftEdge');
        });
      }
    });
  });

  describe('getAxeSource', () => {
    describe('mock file', () => {
      beforeEach(() => {
        mock({
          '/node_modules/axe-core': {},
          '../node_modules/axe-core': {
            'axe.js': mock.load(require.resolve('axe-core'))
          }
        });
      });

      afterEach(() => {
        mock.restore();
      });
      it('fall back to use `locally` installed axe-core', () => {
        const axeSource = utils.getAxeSource();
        const axeVersionCheck = dependencies['axe-core'].replace('^', '');
        assert.include(axeSource, axeVersionCheck);
      });
    });
    it('given no axe source use local source', () => {
      const axeSource = utils.getAxeSource();
      assert.isNotNull(axeSource);
    });

    it('given invalid axe source throws error', () => {
      assert.throws(() => utils.getAxeSource('././././'));
    });
  });

  describe('getAxeVersion', () => {
    it('given valid axe version returns only version', () => {
      assert.deepEqual(utils.getAxeVersion(`axe.version = '4.1.1'`), '4.1.1');
    });

    it('given invalid axe version returns unknown version string', () => {
      assert.deepEqual(utils.getAxeVersion(`axe = '4.1.1'`), 'unknown version');
    });
  });

  describe('splitList', () => {
    it('given a comma delimited string returns array', () => {
      const delimited = 'foo,bar,baz';
      const array = utils.splitList(delimited);
      assert.isArray(array);
      assert.deepEqual(array, ['foo', 'bar', 'baz']);
    });

    it('given a single string returns an array', () => {
      const string = 'foo';
      const array = utils.splitList(string);
      assert.isArray(array);
      assert.deepEqual(array, ['foo']);
    });
  });
});
