import 'mocha';
import Axe from 'axe-core';
import * as fs from 'fs';
import * as path from 'path';
import { assert, expect } from 'chai';
import Puppeteer, { Browser, Page } from 'puppeteer';
import { createServer, Server } from 'http';
import * as sinon from 'sinon';
import testListen from 'test-listen';
import AxePuppeteer from '../src/index';
import {
  startServer,
  puppeteerArgs,
  expectAsync,
  expectAsyncToNotThrow
} from './utils';

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

  before(async () => {
    const axePath = require.resolve('axe-core');
    axeSource = fs.readFileSync(axePath, 'utf8');
    const axeCrashPath = path.resolve(
      __dirname,
      './fixtures/external/axe-crasher.js'
    );
    axeCrasherSource = fs.readFileSync(axeCrashPath, 'utf8');
  });

  before(async () => {
    const args = puppeteerArgs();
    browser = await Puppeteer.launch({ args });
    ({ server, addr } = await startServer());
  });

  after(async () => {
    server.close();
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it('runs in parallel', async () => {
    // Just to prove Puppeteer runs scripts in parallel,
    // and so axe-core/puppeteer should too
    await page.goto(`${addr}/external/index.html`);
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
    expect(out).to.deep.equal(['parallel', true]);
  });

  describe('constructor', () => {
    it('accepts a Page', async () => {
      await page.goto(`${addr}/external/index.html`);
      const axePup = new AxePuppeteer(page);
      await expectAsyncToNotThrow(() => axePup.analyze());
    });

    it('accepts a Frame', async () => {
      await page.goto(`${addr}/external/index.html`);
      const axePup = new AxePuppeteer(page.mainFrame());
      await expectAsyncToNotThrow(() => axePup.analyze());
    });

    it('accepts custom axe-core source', async () => {
      const axeSource = `
        window.axe = {
          run: () => new Promise(resolve => resolve({})),
          configure: () => {}
        }
      `;
      await page.goto(`${addr}/external/index.html`);
      const evalSpy: SinonSpy = sinon.spy(page.mainFrame(), 'evaluate');
      await new AxePuppeteer(page, axeSource).analyze();
      assert(evalSpy.calledWith(axeSource));
    });
  });

  describe('.analyze()', () => {
    it('sets the helpUrl application string', async () => {
      await page.goto(`${addr}/external/iframes/baz.html`);
      const { violations } = await new AxePuppeteer(page)
        .withRules('label')
        .analyze();
      assert.include(violations[0].helpUrl, 'application=axe-puppeteer');
    });

    it('returns correct results metadata', async () => {
      await page.goto(`${addr}/index.html`);
      const results = await new AxePuppeteer(page).analyze();
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
      await page.goto(`${addr}/external/isolated-finish.html`);
      try {
        await new AxePuppeteer(page).analyze();
      } catch (e) {
        err = e;
      }
      assert.isUndefined(err);
    });

    describe('returned promise', () => {
      it("returns results through analyze's promise", async () => {
        await page.goto(`${addr}/external/index.html`);
        const results = await new AxePuppeteer(page)
          .withRules('label')
          .analyze();
        expect(results).to.exist;
        expect(results).to.have.property('passes');
        expect(results).to.have.property('incomplete');
        expect(results).to.have.property('inapplicable');
        expect(results).to.have.property('violations');
      });

      it('lets axe-core errors bubble when using promise API', async () => {
        const axeSource = `
          window.axe = {
            run: () => Promise.reject(new Error('boom')),
            configure: () => {}
          }
        `;

        await page.goto(`${addr}/external/index.html`);

        const axePup = new AxePuppeteer(page, axeSource);
        (await expectAsync(async () => axePup.analyze())).to.throw('boom');
      });
    });

    describe('analyze callback', () => {
      it('returns results through the callback if passed', done => {
        page.goto(`${addr}/external/index.html`).then(() => {
          new AxePuppeteer(page).analyze((err, results) => {
            try {
              expect(err).to.be.null;

              expect(results).to.exist;
              expect(results).to.have.property('passes');
              expect(results).to.have.property('incomplete');
              expect(results).to.have.property('inapplicable');
              expect(results).to.have.property('violations');
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

        await page.goto(`${addr}/external/index.html`);
        await new AxePuppeteer(page, axeSource).analyze(err => {
          expect(err)
            .to.exist.and.be.instanceof(Error)
            .and.have.property('message')
            .that.includes('boom');
        });
      });
    });

    describe('error reporting', () => {
      it('throws if axe errors out on the top window', done => {
        page
          .goto(`${addr}/external/crash.html`)
          .then(() => {
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
          .then(() => {
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
          .then(() => {
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
        addr2 = await testListen(server2);
      });

      after(() => {
        server2.close();
      });

      it('gives a helpful error', done => {
        const gotoP = page.goto(`${addr2}/index.html`);
        gotoP.catch(() => ({})); // suppress Node error

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
                expect(e.message).to.include('not ready');
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

        await page.goto(`${addr}/context.html`);

        const axePip = new AxePuppeteer(page, axeSource)
          .include('.include')
          .exclude('.exclude');

        await expectAsyncToNotThrow(() => axePip.analyze());
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

        await page.goto(`${addr}/context.html`);

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

        await page.goto(`${addr}/context.html`);

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

        await page.goto(`${addr}/context.html`);

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

      await page.goto(`${addr}/context.html`);

      const axePip = new AxePuppeteer(page, axeSource);

      await expectAsyncToNotThrow(() => axePip.analyze());
    });

    describe('.disableFrame()', () => {
      it('disables the given rule(s)', async () => {
        await page.goto(`${addr}/external/nested-iframes.html`);
        const results = await new AxePuppeteer(page)
          // Ignore all frames
          .disableFrame('#ifr-foo, #ifr-bar')
          .disableFrame('#ifr-baz')
          .analyze();

        const labelResult = results.violations.find(
          (r: Axe.Result) => r.id === 'label'
        );
        expect(labelResult).to.be.undefined;
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

      await page.goto(`${addr}/external/index.html`);
      const results = await new AxePuppeteer(page)
        .configure(config)
        .withRules(['foo'])
        .analyze();

      expect(results).to.have.property('passes').with.lengthOf(0);
      expect(results).to.have.property('incomplete').with.lengthOf(0);
      expect(results).to.have.property('inapplicable').with.lengthOf(0);
      expect(results).to.have.property('violations').with.lengthOf(1);
      expect(results.violations[0]).to.have.property('id', 'foo');
    });

    it('gives a helpful error when not passed an object', () => {
      const axePup = new AxePuppeteer(page);

      // Cast a string to a Spec to simulate incorrect usage with Javascript.
      const jsNotASpec = 'not an object' as unknown as Axe.Spec;
      expect(() => axePup.configure(jsNotASpec)).to.throw('needs an object');
    });
  });

  describe('options', () => {
    describe('.options()', () => {
      it('passes options to axe-core', async () => {
        await page.goto(`${addr}/external/index.html`);

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

        expect(flatResults.find((r: Axe.Result) => r.id === 'region')).to.be
          .undefined;
      });
    });

    describe('.withTags()', () => {
      it('only rules with the given tag(s)', async () => {
        await page.goto(`${addr}/external/index.html`);

        const results = await new AxePuppeteer(page)
          .withTags(['best-practice'])
          .analyze();

        const flatResults = [
          ...results.passes,
          ...results.incomplete,
          ...results.inapplicable,
          ...results.violations
        ];

        // Ensure all run rules had the 'best-practice' tag
        for (const rule of flatResults) {
          expect(rule.tags).to.include('best-practice');
        }
      });
    });

    describe('.withRules()', () => {
      it('only rules with the given rule(s)', async () => {
        await page.goto(`${addr}/external/index.html`);

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

        expect(flatResults).to.have.lengthOf(1);
        expect(flatResults[0]).to.have.property('id', 'region');
      });
    });

    describe('.disableRules()', () => {
      it('disables the given rule(s)', async function () {
        await page.goto(`${addr}/external/index.html`);

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

        expect(flatResults.find((r: Axe.Result) => r.id === 'region')).to.be
          .undefined;
      });
    });
  });

  describe('frame tests', () => {
    it('injects into nested iframes', async () => {
      await page.goto(`${addr}/external/nested-iframes.html`);

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
      assert.deepEqual(nodes[1].target, ['#ifr-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#ifr-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#ifr-baz', 'input']);
    });

    it('tests framesets', async () => {
      await page.goto(`${addr}/external/nested-frameset.html`);
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
      assert.deepEqual(nodes[1].target, ['#frm-foo', '#foo-baz', 'input']);
      assert.deepEqual(nodes[2].target, ['#frm-bar', '#bar-baz', 'input']);
      assert.deepEqual(nodes[3].target, ['#frm-baz', 'input']);
    });

    it('tests frames in shadow DOM', async () => {
      await page.goto(`${addr}/external/shadow-frames.html`);
      const { violations } = await new AxePuppeteer(page)
        .options({ runOnly: 'label' })
        .analyze();

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
      await page.goto(`${addr}/external/crash-parent.html`);
      const results = await new AxePuppeteer(page, axeSource + axeCrasherSource)
        .options({ runOnly: ['label', 'frame-tested'] })
        .analyze();

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
      await page.goto(`${addr}/external/nested-iframes.html`);
      const pageResults = await new AxePuppeteer(page).analyze();

      // Calling AxePuppeteer with a frame is deprecated, and will show a warning
      const frame = page.mainFrame();
      const frameResults = await new AxePuppeteer(frame).analyze();

      pageResults.timestamp = frameResults.timestamp;
      assert.deepEqual(pageResults, frameResults);
    });
  });

  describe('axe.finishRun errors', () => {
    const finishRunThrows = `;axe.finishRun = () => { throw new Error("No finishRun")}`;

    it('throws an error if axe.finishRun throws', async () => {
      await page.goto(`${addr}/external/index.html`);
      try {
        await new AxePuppeteer(page, axeSource + finishRunThrows).analyze();
        assert.fail('Should have thrown');
      } catch (err) {
        console.log(err);
        assert.match(err.message, /Please check out/);
      }
    });
  });

  describe('without runPartial', () => {
    let axe403Source: string;
    before(() => {
      const axePath = require.resolve('./fixtures/external/axe-core@legacy.js');
      axe403Source = fs.readFileSync(axePath, 'utf8');
    });

    it('can run', async () => {
      await page.goto(`${addr}/external/nested-iframes.html`);
      const results = await new AxePuppeteer(page, axe403Source)
        .withRules('label')
        .analyze();

      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 4);
      assert.equal(results.testEngine.version, '4.0.3');
    });

    it('throws if the top level errors', done => {
      const source = axe403Source + axeCrasherSource;
      page
        .goto(`${addr}/external/crash.html`)
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
      await page.goto(`${addr}/external/crash-parent.html`);
      const results = await new AxePuppeteer(page, axeSource + axeCrasherSource)
        .withRules(['label', 'frame-tested'])
        .analyze();

      assert.equal(results.incomplete[0].id, 'frame-tested');
      assert.lengthOf(results.incomplete[0].nodes, 1);
      assert.equal(results.violations[0].id, 'label');
      assert.lengthOf(results.violations[0].nodes, 2);
    });
  });
});
