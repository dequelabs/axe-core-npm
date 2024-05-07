import 'mocha';
import Axe from 'axe-core';
import * as fs from 'fs';
import * as path from 'path';
import { assert } from 'chai';
import Puppeteer, { Browser, Page } from 'puppeteer';
import { createServer, Server } from 'http';
import * as sinon from 'sinon';
import listen from 'async-listen';
import { AxePuppeteer } from '../src/index';
import {
  startServer,
  puppeteerOpts,
  expectAsync,
  expectAsyncToNotThrow
} from './utils';
import { fixturesPath } from 'axe-test-fixtures';
import { version } from 'puppeteer/package.json';

type SinonSpy = sinon.SinonSpy;

declare global {
  interface Window {
    parallel?: boolean;
  }
}

describe('AxePuppeteer', function () {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let addr: string;
  this.timeout(10000);

  let axeSource: string;
  let axeCrasherSource: string;
  let axeForceLegacy: string;
  let axeLargePartial: string;

  before(async () => {
    const axePath = require.resolve('axe-core');
    axeSource = fs.readFileSync(axePath, 'utf8');
    axeCrasherSource = fs.readFileSync(
      path.join(fixturesPath, 'axe-crasher.js'),
      'utf8'
    );
    axeForceLegacy = fs.readFileSync(
      path.join(fixturesPath, 'axe-force-legacy.js'),
      'utf8'
    );
    axeLargePartial = fs.readFileSync(
      path.join(fixturesPath, 'axe-large-partial.js'),
      'utf8'
    );
  });

  before(async () => {
    ({ server, addr } = await startServer());
  });

  after(async () => {
    server.close();
  });

  beforeEach(async () => {
    const opts = puppeteerOpts();
    browser = await Puppeteer.launch(opts);
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
    await browser.close();
  });

  it('runs in parallel', async () => {
    // Just to prove Puppeteer runs scripts in parallel,
    // and so axe-core/puppeteer should too
    const res = await page.goto(`${addr}/index.html`);
    const p1 = page.evaluate(() => {
      window.parallel = true;
      return new Promise(res => {
        setTimeout(() => {
          window.parallel = false;
          res('parallel');
        }, 1000);
      });
    });
    const p2 = page.evaluate(() => window.parallel);
    const out = await Promise.all([p1, p2]);

    assert.equal(res?.status(), 200);
    assert.deepEqual(out, ['parallel', true]);
  });

  describe('constructor', () => {
    it('accepts a Page', async () => {
      const res = await page.goto(`${addr}/index.html`);
      const axePup = new AxePuppeteer(page);

      assert.equal(res?.status(), 200);
      await expectAsyncToNotThrow(() => axePup.analyze());
    });

    it('accepts a Frame', async () => {
      const res = await page.goto(`${addr}/index.html`);
      const axePup = new AxePuppeteer(page.mainFrame());

      assert.equal(res?.status(), 200);
      await expectAsyncToNotThrow(() => axePup.analyze());
    });

    it('accepts custom axe-core source', async () => {
      const axeSource = `
        window.axe = {
          run: () => new Promise(resolve => resolve({})),
          configure: () => {}
        }
      `;
      const res = await page.goto(`${addr}/index.html`);
      const evalSpy: SinonSpy = sinon.spy(page.mainFrame(), 'evaluate');
      await new AxePuppeteer(page, axeSource).analyze();

      assert.equal(res?.status(), 200);
      assert(evalSpy.calledWith(axeSource));
    });
  });

  describe('errorUrl', () => {
    it('returns correct errorUrl', () => {
      const errorUrl = (new AxePuppeteer(page) as any).errorUrl;
      assert.equal(
        errorUrl,
        'https://github.com/dequelabs/axe-core-npm/blob/develop/packages/puppeteer/error-handling.md'
      );
    });
  });

  describe('.analyze()', () => {
    it('sets the helpUrl application string', async () => {
      const res = await page.goto(`${addr}/iframes/baz.html`);
      const { violations } = await new AxePuppeteer(page)
        .withRules('label')
        .analyze();

      assert.equal(res?.status(), 200);
      assert.include(violations[0].helpUrl, 'application=axe-puppeteer');
    });

    it('returns correct results metadata', async () => {
      const res = await page.goto(`${addr}/index.html`);
      const results = await new AxePuppeteer(page).analyze();

      assert.equal(res?.status(), 200);
      assert.isDefined(results.testEngine.name);
      assert.isDefined(results.testEngine.version);
      assert.isDefined(results.testEnvironment.orientationAngle);
      assert.isDefined(results.testEnvironment.orientationType);
      assert.isDefined(results.testEnvironment.userAgent);
      assert.isDefined(results.testEnvironment.windowHeight);
      assert.isDefined(results.testEnvironment.windowWidth);
      assert.isDefined(results.testRunner.name);
      assert.isDefined(results.toolOptions.reporter);
      assert.equal(results.url, `${addr}/index.html`);
    });

    it('properly isolates the call to axe.finishRun', async () => {
      let err;
      const res = await page.goto(`${addr}/isolated-finish.html`);
      try {
        await new AxePuppeteer(page).analyze();
      } catch (e) {
        err = e;
      }

      assert.equal(res?.status(), 200);
      assert.isUndefined(err);
    });

    it('handles large results', async function () {
      /* this test handles a large amount of partial results a timeout may be required */
      this.timeout(50_000);
      const res = await await page.goto(`${addr}/index.html`);

      assert.equal(res?.status(), 200);

      const results = await new AxePuppeteer(
        page,
        axeSource + axeLargePartial
      ).analyze();

      assert.lengthOf(results.passes, 1);
      assert.equal(results.passes[0].id, 'duplicate-id');
    });

    it('returns the same results from runPartial as from legacy mode', async () => {
      const res = await page.goto(`${addr}/nested-iframes.html`);
      const legacyResults = await new AxePuppeteer(
        page,
        axeSource + axeForceLegacy
      ).analyze();

      assert.equal(res?.status(), 200);
      assert.equal(legacyResults.testEngine.name, 'axe-legacy');

      const normalResults = await new AxePuppeteer(page, axeSource).analyze();
      normalResults.timestamp = legacyResults.timestamp;
      normalResults.testEngine.name = legacyResults.testEngine.name;
      assert.deepEqual(normalResults, legacyResults);
    });

    describe('returned promise', () => {
      it("returns results through analyze's promise", async () => {
        const res = await page.goto(`${addr}/index.html`);
        const results = await new AxePuppeteer(page)
          .withRules('label')
          .analyze();

        assert.equal(res?.status(), 200);
        assert.isOk(results);
        assert.property(results, 'passes');
        assert.property(results, 'incomplete');
        assert.property(results, 'inapplicable');
        assert.property(results, 'violations');
      });

      it('lets axe-core errors bubble when using promise API', async () => {
        const axeSource = `
          window.axe = {
            run: () => Promise.reject(new Error('boom')),
            configure: () => {}
          }
        `;

        const res = await page.goto(`${addr}/index.html`);

        const axePup = new AxePuppeteer(page, axeSource);

        assert.equal(res?.status(), 200);
        (await expectAsync(async () => axePup.analyze())).to.throw('boom');
      });
    });

    describe('analyze callback', () => {
      it('returns results through the callback if passed', done => {
        page.goto(`${addr}/index.html`).then(res => {
          new AxePuppeteer(page).analyze((err, results) => {
            try {
              assert.equal(res?.status(), 200);
              assert.isNull(err);
              assert.isOk(results);
              assert.property(results, 'passes');
              assert.property(results, 'incomplete');
              assert.property(results, 'inapplicable');
              assert.property(results, 'violations');
              done();
            } catch (e) {
              done(e);
            }
          });
        });
      });

      it('passes axe-core errors when using callback API', async function () {
        const axeSource = `
          window.axe = {
            run: () => Promise.reject(new Error('boom')),
            configure: () => {}
          }
        `;

        const res = await page.goto(`${addr}/index.html`);

        assert.equal(res?.status(), 200);

        await new AxePuppeteer(page, axeSource).analyze(err => {
          assert.instanceOf(err, Error);
          assert.property(err, 'message');
          assert.include(err!.message, 'boom');
        });
      });
    });

    describe('error reporting', () => {
      it('throws if axe errors out on the top window', done => {
        page
          .goto(`${addr}/crash.html`)
          .then(res => {
            assert.equal(res?.status(), 200);
            return new AxePuppeteer(
              page,
              axeSource + axeCrasherSource
            ).analyze();
          })
          .then(
            () => done(new Error('Expect async function to throw')),
            () => done()
          );
      });

      it('throws when injecting a problematic source', done => {
        page
          .goto(`${addr}/crash.html`)
          .then(res => {
            assert.equal(res?.status(), 200);
            return new AxePuppeteer(page, 'throw new Error()').analyze();
          })
          .then(
            () => done(new Error('Expect async function to throw')),
            () => done()
          );
      });

      it('throws when a setup fails', done => {
        const brokenSource = axeSource + `;window.axe.utils = {}`;
        page
          .goto(`${addr}/index.html`)
          .then(res => {
            assert.equal(res?.status(), 200);
            return new AxePuppeteer(page, brokenSource)
              .withRules('label')
              .analyze();
          })
          .then(
            () => done(new Error(`Expect async function to throw`)),
            () => done()
          );
      });
    });

    describe("when given a page that hasn't loaded", () => {
      let server2: Server;
      let addr2: string;
      before(async () => {
        server2 = createServer((req: any, res: any) => {
          const html = `
            <html>
              <body>
                <script async src="${addr2}/wait.js"></script>
              </body>
            </html>
          `;
          const js = 'document.write(2)';

          if (req.url.indexOf('index') !== -1) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(html);
            res.end();
          } else {
            setTimeout(() => {
              res.writeHead(200, {
                'Content-Type': 'application/javascript'
              });
              res.write(js);
              res.end();
            }, 3000);
          }
        });
        // async-listen adds trailing forward slash,
        // this removes the unnecessary trailing forward slash
        addr2 = (await listen(server2)).toString().replace(/\/$/, '');
      });

      after(() => {
        server2.close();
      });

      it('gives a helpful error', done => {
        page
          .goto(`${addr2}/index.html`)
          .then(res => {
            assert.equal(res?.status(), 200);
          })
          .catch(() => {
            // suppress Node error
          });

        // Delay so that page load can actually start
        setTimeout(() => {
          const axePup = new AxePuppeteer(page);
          axePup
            .analyze()
            .then(
              () => {
                done(
                  'Expect AxePuppeteer to throw when passed an unloaded page'
                );
              },
              e => {
                assert.include(e.message, 'not ready');
                done();
              }
            )
            .catch(done);
        }, 10);
      });
    });
  });

  describe('context', () => {
    describe('with include and exclude', () => {
      const flatPassesTargets = (results: Axe.AxeResults): string[] => {
        return results.passes
          .reduce((acc, pass) => {
            return acc.concat(pass.nodes as any);
          }, [])
          .reduce((acc, node: any) => {
            return acc.concat(node.target.flat(1));
          }, []);
      };
      it('passes both .include and .exclude', async () => {
        const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context === document) {
                return Promise.reject(new Error('Invalid context'))
              }
              if (context.include[0] !== '.include') {
                return Promise.reject(new Error('Invalid include context'))
              }

              if (context.exclude[0] !== '.exclude') {
                return Promise.reject(new Error('Invalid exclude context'))
              }

              return Promise.resolve({})
            }
          }
        `;

        const res = await page.goto(`${addr}/context-include-exclude.html`);
        assert.equal(res?.status(), 200);

        const axePip = new AxePuppeteer(page, axeSource)
          .include('.include')
          .exclude('.exclude');

        await expectAsyncToNotThrow(() => axePip.analyze());
      });

      it('with labelled frame', async () => {
        await page.goto(`${addr}/context-include-exclude.html`);
        const results = await new AxePuppeteer(page)
          .include({ fromFrames: ['#ifr-inc-excl', 'html'] })
          .exclude({ fromFrames: ['#ifr-inc-excl', '#foo-bar'] })
          .include({ fromFrames: ['#ifr-inc-excl', '#foo-baz', 'html'] })
          .exclude({ fromFrames: ['#ifr-inc-excl', '#foo-baz', 'input'] })
          .analyze();
        const labelResult = results.violations.find(
          (r: Axe.Result) => r.id === 'label'
        );
        assert.isFalse(flatPassesTargets(results).includes('#foo-bar'));
        assert.isFalse(flatPassesTargets(results).includes('input'));
        assert.isUndefined(labelResult);
      });

      it('with include shadow DOM', async () => {
        await page.goto(`${addr}/shadow-dom.html`);
        const results = await new AxePuppeteer(page)
          .include([['#shadow-root-1', '#shadow-button-1']])
          .include([['#shadow-root-2', '#shadow-button-2']])
          .analyze();
        assert.isTrue(flatPassesTargets(results).includes('#shadow-button-1'));
        assert.isTrue(flatPassesTargets(results).includes('#shadow-button-2'));
        assert.isFalse(flatPassesTargets(results).includes('#button'));
      });

      it('with exclude shadow DOM', async () => {
        await page.goto(`${addr}/shadow-dom.html`);
        const results = await new AxePuppeteer(page)
          .exclude([['#shadow-root-1', '#shadow-button-1']])
          .exclude([['#shadow-root-2', '#shadow-button-2']])
          .analyze();
        assert.isFalse(flatPassesTargets(results).includes('#shadow-button-1'));
        assert.isFalse(flatPassesTargets(results).includes('#shadow-button-2'));
        assert.isTrue(flatPassesTargets(results).includes('#button'));
      });

      it('with labelled shadow DOM', async () => {
        await page.goto(`${addr}/shadow-dom.html`);
        const results = await new AxePuppeteer(page)
          .include({ fromShadowDom: ['#shadow-root-1', '#shadow-button-1'] })
          .exclude({ fromShadowDom: ['#shadow-root-2', '#shadow-button-2'] })
          .analyze();
        assert.isTrue(flatPassesTargets(results).includes('#shadow-button-1'));
        assert.isFalse(flatPassesTargets(results).includes('#shadow-button-2'));
      });

      it('with labelled iframe and shadow DOM', async () => {
        await page.goto(`${addr}/shadow-frames.html`);
        const { violations } = await new AxePuppeteer(page)
          .exclude({
            fromFrames: [
              {
                fromShadowDom: ['#shadow-root', '#shadow-frame']
              },
              'input'
            ]
          })
          .options({ runOnly: 'label' })
          .analyze();
        assert.equal(violations[0].id, 'label');
        assert.lengthOf(violations[0].nodes, 2);
        const nodes = violations[0].nodes;
        assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
        assert.deepEqual(nodes[1].target, ['#slotted-frame', 'input']);
      });
    });

    // See #58
    describe('excluded with an array of strings', () => {
      it('properly sets context.exclude', async () => {
        const expected = ['.foo', '.bar', '.baz', '.qux'];

        const axeSource = `
          window.axe = {
            configure(){},
            run({ exclude }){
              return Promise.resolve({ exclude })
            }
          }
        `;

        const res = await page.goto(`${addr}/context-include-exclude.html`);
        assert.equal(res?.status(), 200);

        const axePip = new AxePuppeteer(page, axeSource)
          .include('.include')
          .exclude(['.foo', '.bar', '.baz', '.qux']);

        const { exclude: actual } = (await axePip.analyze()) as any;
        assert.deepEqual(actual[0], expected);
      });
    });

    describe('with only include', () => {
      it('adds .include to context', async () => {
        const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context === document) {
                return Promise.reject(new Error('Invalid context'))
              }
              if (context.include[0] !== '.include') {
                return Promise.reject(new Error('Invalid include context'))
              }

              if (context.exclude) {
                return Promise.reject(new Error('Invalid exclude context'))
              }

              return Promise.resolve({})
            }
          }
        `;

        const res = await page.goto(`${addr}/context-include-exclude.html`);
        assert.equal(res?.status(), 200);

        const axePip = new AxePuppeteer(page, axeSource).include('.include');

        await expectAsyncToNotThrow(() => axePip.analyze());
      });
    });

    describe('with only exclude', () => {
      it('adds .exclude to context', async () => {
        const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context === document) {
                return Promise.reject(new Error('Invalid context'))
              }
              if (context.include) {
                return Promise.reject(new Error('Invalid include context'))
              }

              if (context.exclude[0] !== '.exclude') {
                return Promise.reject(new Error('Invalid exclude context'))
              }

              return Promise.resolve({})
            }
          }
        `;

        const res = await page.goto(`${addr}/context-include-exclude.html`);
        assert.equal(res?.status(), 200);

        const axePip = new AxePuppeteer(page, axeSource).exclude('.exclude');

        await expectAsyncToNotThrow(() => axePip.analyze());
      });
    });

    it('defaults to document', async () => {
      const axeSource = `
          window.axe = {
            configure () {},
            run (context, options, config) {
              if (context !== document) {
                return Promise.reject(new Error('Invalid context'))
              }

              return Promise.resolve({})
            }
          }
        `;

      const res = await page.goto(`${addr}/context-include-exclude.html`);
      assert.equal(res?.status(), 200);

      const axePip = new AxePuppeteer(page, axeSource);

      await expectAsyncToNotThrow(() => axePip.analyze());
    });

    describe('.disableFrame()', () => {
      it('disables the given rule(s)', async () => {
        const res = await page.goto(`${addr}/nested-iframes.html`);
        const results = await new AxePuppeteer(page)
          // Ignore all frames
          .disableFrame('#ifr-foo, #ifr-bar')
          .disableFrame('#ifr-baz')
          .analyze();

        const labelResult = results.violations.find(
          (r: Axe.Result) => r.id === 'label'
        );
        assert.equal(res?.status(), 200);
        assert.isUndefined(labelResult);
      });
    });
  });

  describe('.configure()', () => {
    it('accepts custom configuration', async () => {
      const config: Axe.Spec = {
        checks: [
          {
            evaluate: 'function () { return false }',
            id: 'foo'
          }
        ],
        rules: [
          {
            all: [],
            any: ['foo'],
            id: 'foo',
            none: [],
            selector: 'html',
            tags: ['wcag2aa']
          }
        ]
      };

      const res = await page.goto(`${addr}/index.html`);
      const results = await new AxePuppeteer(page)
        .configure(config)
        .withRules(['foo'])
        .analyze();

      assert.equal(res?.status(), 200);
      assert.property(results, 'passes');
      assert.lengthOf(results.passes, 0);
      assert.property(results, 'incomplete');
      assert.lengthOf(results.incomplete, 0);
      assert.property(results, 'inapplicable');
      assert.lengthOf(results.inapplicable, 0);
      assert.property(results, 'violations');
      assert.lengthOf(results.violations, 1);
      assert.isDefined(results.violations.find(v => v.id === 'foo'));
    });

    it('gives a helpful error when not passed an object', () => {
      const axePup = new AxePuppeteer(page);

      // Cast a string to a Spec to simulate incorrect usage with Javascript.
      const jsNotASpec = 'not an object' as unknown as Axe.Spec;
      assert.throws(() => axePup.configure(jsNotASpec), 'needs an object');
    });
  });

  describe('options', () => {
    describe('.options()', () => {
      it('passes options to axe-core', async () => {
        const res = await page.goto(`${addr}/index.html`);

        const results = await new AxePuppeteer(page)
          // Disable the `region` rule
          .options({ rules: { region: { enabled: false } } })
          .analyze();

        const flatResults = [
          ...results.passes,
          ...results.incomplete,
          ...results.inapplicable,
          ...results.violations
        ];

        assert.equal(res?.status(), 200);
        assert.isUndefined(flatResults.find(res => res.id === 'region'));
      });
    });

    describe('.withTags()', () => {
      it('only rules with the given tag(s)', async () => {
        const res = await page.goto(`${addr}/index.html`);

        const results = await new AxePuppeteer(page)
          .withTags(['best-practice'])
          .analyze();

        const flatResults = [
          ...results.passes,
          ...results.incomplete,
          ...results.inapplicable,
          ...results.violations
        ];

        assert.equal(res?.status(), 200);

        // Ensure all run rules had the 'best-practice' tag
        for (const rule of flatResults) {
          assert.include(rule.tags, 'best-practice');
        }
      });
    });

    describe('.withRules()', () => {
      it('only rules with the given rule(s)', async () => {
        const res = await page.goto(`${addr}/index.html`);

        const results = await new AxePuppeteer(page)
          // Only enable the `region` rule
          .withRules(['region'])
          .analyze();

        const flatResults = [
          ...results.passes,
          ...results.incomplete,
          ...results.inapplicable,
          ...results.violations
        ];

        assert.equal(res?.status(), 200);
        assert.lengthOf(flatResults, 1);
        assert.isDefined(flatResults.find(r => r.id === 'region'));
      });
    });

    describe('.disableRules()', () => {
      it('disables the given rule(s)', async function () {
        const res = await page.goto(`${addr}/index.html`);

        const results = await new AxePuppeteer(page)
          // Disable the `region` rule
          .disableRules(['region'])
          .analyze();

        const flatResults = [
          ...results.passes,
          ...results.incomplete,
          ...results.inapplicable,
          ...results.violations
        ];

        assert.equal(res?.status(), 200);
        assert.isUndefined(flatResults.find(res => res.id === 'region'));
      });
    });
  });

  describe('frame tests', () => {
    it('injects into nested iframes', async () => {
      const res = await page.goto(`${addr}/nested-iframes.html`);

      const { violations } = await new AxePuppeteer(page)
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(violations[0].id, 'label');
      const nodes = violations[0].nodes;
      assert.lengthOf(nodes, 4);
      assert.deepEqual(nodes[0].target, [
        '#ifr-foo',
        '#foo-bar',
        '#bar-baz',
        'input'
      ]);

      assert.equal(res?.status(), 200);
      assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
    });

    it('tests framesets', async () => {
      const res = await page.goto(`${addr}/nested-frameset.html`);
      const { violations } = await new AxePuppeteer(page)
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(violations[0].id, 'label');
      assert.lengthOf(violations[0].nodes, 4);
      const nodes = violations[0].nodes;
      assert.deepEqual(nodes[0].target, [
        '#frm-foo',
        '#foo-bar',
        '#bar-baz',
        'input'
      ]);

      assert.equal(res?.status(), 200);
      assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
    });

    it('tests frames in shadow DOM', async () => {
      const res = await page.goto(`${addr}/shadow-frames.html`);
      const { violations } = await new AxePuppeteer(page)
        .options({ runOnly: 'label' })
        .analyze();

      assert.equal(res?.status(), 200);
      assert.equal(violations[0].id, 'label');
      assert.lengthOf(violations[0].nodes, 3);

      const nodes = violations[0].nodes;
      assert.deepEqual(nodes[0].target, ['#light-frame', 'input']);
      assert.deepEqual(nodes[1].target, [
        ['#shadow-root', '#shadow-frame'],
        'input'
      ]);
      assert.deepEqual(nodes[2].target, ['#slotted-frame', 'input']);
    });

    it('reports erroring frames in frame-tested', async () => {
      const res = await page.goto(`${addr}/crash-parent.html`);
      const results = await new AxePuppeteer(page, axeSource + axeCrasherSource)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      assert.equal(res?.status(), 200);
      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.deepEqual(results.incomplete[0].nodes[0].target, ['#ifr-crash']);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
      assert.deepEqual(results.violations[0].nodes[0].target, [
        '#ifr-bar',
        '#bar-baz',
        'input'
      ]);
      assert.deepEqual(results.violations[0].nodes[1].target, [
        '#ifr-baz',
        'input'
      ]);
    });

    it('runs the same when passed a Frame', async () => {
      const res = await page.goto(`${addr}/nested-iframes.html`);
      const pageResults = await new AxePuppeteer(page).analyze();

      // Calling AxePuppeteer with a frame is deprecated, and will show a warning
      const frame = page.mainFrame();
      const frameResults = await new AxePuppeteer(frame).analyze();

      pageResults.timestamp = frameResults.timestamp;

      assert.equal(res?.status(), 200);
      assert.deepEqual(pageResults, frameResults);
    });

    it('skips unloaded iframes (e.g. loading=lazy)', async () => {
      const res = await page.goto(`${addr}/lazy-loaded-iframe.html`);
      const results = await new AxePuppeteer(page)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

      // puppeteer version 22 (regardless of chrome version) is able to load
      // lazy loaded iframes and run axe on them without timing out, but we
      // still want to test that our code works with versions <22 to handle
      // the iframe by giving a frame-tested incomplete
      const [majorVersion] = version.split('.').map(Number);
      if (majorVersion < 22) {
        assert.equal(res?.status(), 200);
        assert.equal(results.incomplete[0].id, 'frame-tested');
        assert.lengthOf(results.incomplete[0].nodes, 1);
        assert.deepEqual(results.incomplete[0].nodes[0].target, [
          '#ifr-lazy',
          '#lazy-iframe'
        ]);
      }

      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 1);
      assert.deepEqual(results.violations[0].nodes[0].target, [
        '#ifr-lazy',
        '#lazy-baz',
        'input'
      ]);
    });
  });

  describe('axe.finishRun errors', () => {
    const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;
    it('throws an error if window.open throws', async () => {
      const res = await page.goto(`${addr}/index.html`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete page.browser().newPage();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      page.browser().newPage = async () => {
        return null;
      };

      assert.equal(res?.status(), 200);
      try {
        await new AxePuppeteer(page, axeSource).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match(
          (err as Error).message,
          /Please make sure that you have popup blockers disabled./
        );
        assert.include(
          (err as Error).message,
          'Please check out https://github.com/dequelabs/axe-core-npm/blob/develop/packages/puppeteer/error-handling.md'
        );
      }
    });

    it('throw an error with modified url', async () => {
      const res = await page.goto(`${addr}/index.html`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete page.browser().newPage();
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      page.browser().newPage = async () => {
        return null;
      };

      assert.equal(res?.status(), 200);
      try {
        const builder = new AxePuppeteer(page, axeSource) as any;
        builder.errorUrl = 'https://deque.biz';
        await builder.analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match(
          (err as Error).message,
          /Please make sure that you have popup blockers disabled./
        );
        assert.include(
          (err as Error).message,
          'Please check out https://deque.biz'
        );
      }
    });

    it('throws an error if axe.finishRun throws', async () => {
      const res = await page.goto(`${addr}/index.html`);

      assert.equal(res?.status(), 200);
      try {
        await new AxePuppeteer(page, axeSource + finishRunThrows).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        assert.match((err as Error).message, /Please check out/);
      }
    });
  });

  describe('setLegacyMode', () => {
    const runPartialThrows = `;axe.runPartial = () => { throw new Error("No runPartial")}`;
    it('runs legacy mode when used', async () => {
      const res = await page.goto(`${addr}/index.html`);
      const results = await new AxePuppeteer(page, axeSource + runPartialThrows)
        .setLegacyMode()
        .analyze();

      assert.equal(res?.status(), 200);
      assert.isNotNull(results);
    });

    it('prevents cross-origin frame testing', async () => {
      const res = await page.goto(`${addr}/cross-origin.html`);
      const results = await new AxePuppeteer(page, axeSource + runPartialThrows)
        .withRules('frame-tested')
        .setLegacyMode()
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );

      assert.equal(res?.status(), 200);
      assert.ok(frameTested);
    });

    it('can be disabled again', async () => {
      const res = await page.goto(`${addr}/cross-origin.html`);
      const results = await new AxePuppeteer(page)
        .withRules('frame-tested')
        .setLegacyMode()
        .setLegacyMode(false)
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );

      assert.equal(res?.status(), 200);
      assert.isUndefined(frameTested);
    });
  });

  describe('without runPartial', () => {
    let axe403Source: string;
    before(() => {
      const axePath = path.join(fixturesPath, 'axe-core@legacy.js');
      axe403Source = fs.readFileSync(axePath, 'utf8');
    });

    it('can run', async () => {
      const res = await page.goto(`${addr}/nested-iframes.html`);
      const results = await new AxePuppeteer(page, axe403Source)
        .withRules('label')
        .analyze();

      assert.equal(res?.status(), 200);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 4);
      assert.equal(results.testEngine.version, '4.2.3');
    });

    it('throws if the top level errors', done => {
      const source = axe403Source + axeCrasherSource;
      page
        .goto(`${addr}/crash.html`)
        .then(() => {
          return new AxePuppeteer(page, source).withRules('label').analyze();
        })
        .then(
          out => {
            console.log(out);
            done(new Error('Expect async function to throw'));
          },
          () => done()
        );
    });

    it('reports frame-tested', async () => {
      const res = await page.goto(`${addr}/crash-parent.html`);
      const results = await new AxePuppeteer(page, axeSource + axeCrasherSource)
        .withRules(['label', 'frame-tested'])
        .analyze();

      assert.equal(res?.status(), 200);
      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });

    it('tests cross-origin pages', async () => {
      const res = await page.goto(`${addr}/cross-origin.html`);
      const results = await new AxePuppeteer(page, axe403Source)
        .withRules('frame-tested')
        .analyze();

      const frameTested = results.incomplete.find(
        ({ id }) => id === 'frame-tested'
      );

      assert.equal(res?.status(), 200);
      assert.isUndefined(frameTested);
    });
  });

  describe('allowedOrigins', () => {
    const getAllowedOrigins = async (): Promise<string[]> => {
      return (await page.evaluate(
        'axe._audit.allowedOrigins'
      )) as unknown as string[];
    };

    it('should not set when running runPartial and not legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxePuppeteer(page).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
      assert.lengthOf(allowedOrigins, 1);
    });

    it('should not set when running runPartial and legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxePuppeteer(page).setLegacyMode(true).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
    });

    it('should not set when running legacy source and legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxePuppeteer(page, axeSource + axeForceLegacy)
        .setLegacyMode(true)
        .analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, [addr]);
    });

    it('should set when running legacy source and not legacy mode', async () => {
      await page.goto(`${addr}/index.html`);
      await new AxePuppeteer(page, axeSource + axeForceLegacy).analyze();
      const allowedOrigins = await getAllowedOrigins();
      assert.deepEqual(allowedOrigins, ['*']);
      assert.lengthOf(allowedOrigins, 1);
    });
  });
});
