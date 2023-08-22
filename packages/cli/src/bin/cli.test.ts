import 'mocha';
import { assert } from 'chai';
import tempy from 'tempy';
import http from 'http';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { version } from '../../package.json';
import runCLI from '../testutils/';

const SIMPLE_HTML_FILE = path.join(__dirname, '..', 'testutils', 'simple.html');
const SIMPLE_CLEAN_HTML_FILE = path.join(
  __dirname,
  '..',
  'testutils',
  'simple-clean.html'
);
const SIMPLE_HTML_SOURCE = fs.readFileSync(SIMPLE_HTML_FILE, 'utf8');
const PATH_TO_AXE_250 = path.resolve(
  __dirname,
  '..',
  'testutils',
  'axe-core@2.5.0.js'
);

describe('cli', () => {
  it('--help', async () => {
    const result = await runCLI('--help');
    assert.equal(result.exitCode, 0);
    assert.include(result.stdout, 'Options:');
  });

  it('--version', async () => {
    const result = await runCLI('--version');
    assert.equal(result.exitCode, 0);
    assert.deepEqual(result.stdout, version);
  });

  describe('given a file:// url', () => {
    it('should run an analysis', async () => {
      const result = await runCLI(`file://${SIMPLE_HTML_FILE}`);
      assert.equal(result.exitCode, 0);
      assert.include(
        result.stdout,
        'Violation of "marquee" with 1 occurrences!'
      );
    });
  });

  describe('given a http:// url', () => {
    let port: number;
    let server: http.Server;
    before(done => {
      server = http.createServer((req, res) => {
        res.setHeader('Content-Type', 'text/html');
        res.write(SIMPLE_HTML_SOURCE);
        res.end();
      });
      server.listen(0, () => {
        port = (server.address() as net.AddressInfo).port;
        done();
      });
    });

    after(done => server.close(done));

    it('should run an analysis', async () => {
      const result = await runCLI(`http://127.0.0.1:${port}/`);
      assert.equal(result.exitCode, 0);
      assert.include(
        result.stdout,
        'Violation of "marquee" with 1 occurrences!'
      );
    });
  });

  describe('--axe-source', () => {
    it('should use the provided version of axe-core', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--axe-source',
        PATH_TO_AXE_250
      );

      assert.equal(result.exitCode, 0);
      assert.include(
        result.stdout,
        'Violation of "marquee" with 1 occurrences!'
      );
      assert.include(result.stdout, 'Running axe-core 2.5.0');
    });

    it('error when given invalid axe source path', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--axe-source',
        'foobar'
      );

      assert.equal(result.exitCode, 2);
      assert.include(result.stderr, 'Unable to find the axe-core source file');
    });
  });

  // cannot run in ci we _should_ have the ability to add arguments to firefox not just chrome to allow users to run this headless
  describe.skip('--browser', () => {
    it('should change the browser', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--browser',
        'firefox',
        '--verbose'
      );
      assert.equal(result.exitCode, 0);
      assert.include(result.stdout, 'Firefox');
    });
  });

  describe('--rules', () => {
    it('should only run the rules with the provided IDs', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--rules',
        'region'
      );
      assert.equal(result.exitCode, 0);
      assert.include(result.stdout, 'Violation of "region" with');
    });
  });

  describe('--tags', () => {
    it('should only run rules with the provided tags', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--tags',
        'cat.parsing,wcag222'
      );
      assert.equal(result.exitCode, 0);
      // Region is tagged with "cat.keyboard", "best-practice"
      assert.notInclude(result.stdout, 'Violation of "region" with');
    });
  });

  describe('--exit', () => {
    it('should exit non-zero if violations are found', async () => {
      try {
        await runCLI(`file://${SIMPLE_HTML_FILE}`, '--exit');
      } catch (error) {
        assert.equal(error.exitCode, 1);
        assert.include(
          error.stdout,
          'Violation of "marquee" with 1 occurrences!'
        );
      }
    });

    it('should exit zero if violations are found', async () => {
      try {
        await runCLI(`file://${SIMPLE_CLEAN_HTML_FILE}`, '--exit');
      } catch (error) {
        assert.equal(error.exitCode, 0);
        assert.include(
          error.stdout,
          'Violation of "marquee" with 1 occurrences!'
        );
      }
    });
  });

  describe('--dir', () => {
    let reportDir: string;
    beforeEach(() => {
      reportDir = tempy.directory();
    });

    it('should save a JSON report to the provided directory', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--dir',
        reportDir
      );

      assert.equal(result.exitCode, 0);
      const files = fs.readdirSync(reportDir);
      const report = files.find(f => f.endsWith('.json'));
      assert(report, 'Did not create JSON report');
    });
  });

  describe('--include', () => {
    it('should set a list of elements to include', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--include',
        'marquee'
      );
      assert.notInclude(result.stdout, 'Violation of "region"');
      assert.include(
        result.stdout,
        'Violation of "marquee" with 1 occurrences!'
      );
    });

    it('should throw error if CSS selector is not found', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--include',
        '#hazaar',
        '--show-errors'
      );

      assert.include(
        result.stderr,
        'javascript error: No elements found for include in page Context'
      );
      assert.equal(result.exitCode, 1);
    });

    it('should throw error if invalid selector is provided', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--include',
        '#123',
        '--show-errors'
      );

      assert.include(result.stderr, 'is not a valid selector');
      assert.equal(result.exitCode, 1);
    });
  });

  describe('--exclude', () => {
    it('should set a list of elements to exclude', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--exclude',
        'marquee'
      );
      assert.notInclude(
        result.stdout,
        'Violation of "marquee" with 1 occurrences!'
      );
    });

    it('should throw error if invalid selector is provided', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--exclude',
        '#123',
        '--show-errors'
      );

      assert.include(result.stderr, 'is not a valid selector');
      assert.equal(result.exitCode, 1);
    });
  });

  describe('--disable', () => {
    it('should not run rules with the provided IDs', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--disable',
        'region'
      );
      assert.notInclude(result.stdout, 'Violation of "region" with');
    });
  });

  describe('--stdout', () => {
    it('should only emit JSON to stdout', async () => {
      const result = await runCLI(`file://${SIMPLE_HTML_FILE}`, '--stdout');
      assert.equal(result.exitCode, 0);
      assert.doesNotThrow(
        () => JSON.parse(result.stdout),
        'Emitted invalid JSON'
      );
    });
  });

  describe('--timer', () => {
    it('should log the time it takes to run', async () => {
      const result = await runCLI(`file://${SIMPLE_HTML_FILE}`, '--timer');
      assert.equal(result.exitCode, 0);
      assert.isEmpty(result.stderr);
      assert.include(result.stdout, 'axe-core execution time');
      assert.include(result.stdout, 'Total test time');
    });
  });

  describe('--no-reporter', () => {
    it('should log the time it takes to run', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--no-reporter'
      );
      assert.equal(result.exitCode, 0);
      assert.notInclude(
        result.stdout,
        'Violation of "marquee" with 1 occurrences!'
      );
    });
  });

  describe('--show-errors', () => {
    it('should log the time it takes to run defaults to show errors', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--include',
        '#hazaar'
      );
      assert.equal(result.exitCode, 1);
      assert.include(
        result.stderr,
        'Error: JavascriptError: javascript error:'
      );
    });

    it('do not show errors when passed false', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--include',
        '#hazaar',
        '--show-errors',
        'false'
      );
      assert.equal(result.exitCode, 1);
      assert.include(
        result.stderr,
        'An error occurred while testing this page.'
      );
    });
  });

  describe('--save', () => {
    let reportDir: string;
    beforeEach(() => {
      reportDir = tempy.directory();
    });

    it('should save the output as a JSON file', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--save',
        'test-name.json',
        '--dir',
        reportDir
      );
      const [report] = fs.readdirSync(reportDir);
      assert.equal(result.exitCode, 0);
      assert.equal(report, 'test-name.json');
    });
  });

  describe('--load-delay', () => {
    it('should set how much time axe will wait after a page loads before running the audit', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--load-delay',
        '1000'
      );
      assert.equal(result.exitCode, 0);
      assert.include(
        result.stdout,
        'Waiting for 1000 milliseconds after page load'
      );
    });
  });

  describe('--verbose', () => {
    it('should output metadata such as test tool name, version and environment', async () => {
      const result = await runCLI(`file://${SIMPLE_HTML_FILE}`, '--verbose');
      assert.equal(result.exitCode, 0);
      assert.include(result.stdout, 'Test Runner');
      assert.include(result.stdout, 'Test Engine');
      assert.include(result.stdout, 'Test Environment');
    });
  });

  describe('--timeout', () => {
    // Timeout the page immediately. Ideally we'd block the page for awhile, then timeout based on that. This seemed easier for now tho.
    it('should set the page load timeout', async () => {
      try {
        await runCLI(`file://${SIMPLE_HTML_FILE}`, '--timeout', '0');
      } catch (error) {
        assert.notEqual(error.exitCode, 0);
        assert.include(
          error.stderr,
          'An error occurred while testing this page.'
        );
      }
    });
  });

  describe('--chromedriver-path', () => {
    it('should throw error if path does not exist', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--chromedriver-path="someinvalidpath"',
        '--show-errors'
      );
      assert.include(
        result.stderr,
        'The specified executable path does not exist'
      );
    });
  });

  describe('--chrome-path', () => {
    it('should throw error if path does not exist', async () => {
      const result = await runCLI(
        `file://${SIMPLE_HTML_FILE}`,
        '--chrome-path="someinvalidpath"',
        '--show-errors'
      );
      assert.include(result.stderr, 'no chrome binary at');
    });
  });
});
