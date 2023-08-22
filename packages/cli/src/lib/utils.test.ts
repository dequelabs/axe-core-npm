import 'mocha';
import { assert } from 'chai';
import tempy from 'tempy';
import { join } from 'path';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
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
      function setupTree() {
        const tempDir = tempy.directory();
        const parentDirname = join(tempDir, 'node_modules', 'axe-core');
        mkdirSync(parentDirname, { recursive: true });
        writeFileSync(join(parentDirname, 'axe.js'), 'parent');

        mkdirSync(join(tempDir, 'packages'));
        const cliDirname = join(tempDir, 'packages', 'cli');
        mkdirSync(join(tempDir, 'packages', 'cli'));
        mkdirSync(join(tempDir, 'packages', 'cli', 'node_modules'));
        const nodeModDirname = join(
          tempDir,
          'packages',
          'cli',
          'node_modules',
          'axe-core'
        );
        mkdirSync(nodeModDirname);
        writeFileSync(join(nodeModDirname, 'axe.js'), 'node modules');

        const cwdDirname = join(tempDir, 'packages', 'cli', 'lib');
        mkdirSync(cwdDirname);
        writeFileSync(join(cwdDirname, 'axe.js'), 'cwd');
        return {
          cliDirname,
          parentDirname,
          nodeModDirname,
          cwdDirname
        };
      }

      it('uses axe.js from the working directory if it exists', () => {
        const { cwdDirname } = setupTree();
        const axeSource = utils.getAxeSource(undefined, cwdDirname);
        assert.include(axeSource, 'cwd');
      });
      it("falls back to axe-core from the working directory's node_modules if axe.js doesn't exist in the working directory", () => {
        const { cliDirname, cwdDirname } = setupTree();
        rmSync(join(cwdDirname, 'axe.js'));
        const axeSource = utils.getAxeSource(undefined, cliDirname);
        assert.include(axeSource, 'node modules');
      });
      it("falls back to axe-core from our own package's node_modules if no working-directory based implementation exists", () => {
        const { cwdDirname, nodeModDirname } = setupTree();
        rmSync(join(cwdDirname, 'axe.js'));
        rmSync(join(nodeModDirname, 'axe.js'));
        const axeSource = utils.getAxeSource(undefined, cwdDirname);
        assert.include(axeSource, 'parent');
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
