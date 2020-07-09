import 'mocha';
import Axe from 'axe-core';
import { assert, expect } from 'chai';
import express from 'express';
import { createServer } from 'http';
import * as path from 'path';
import Puppeteer from 'puppeteer';
import * as sinon from 'sinon';
import testListen from 'test-listen';
import AxePuppeteer, { loadPage } from '../src/index';

type SinonSpy = sinon.SinonSpy;
type Frame = Puppeteer.Frame;

const ExpectAssertionVal = (false as true) && expect(null);
type ExpectAssertion = typeof ExpectAssertionVal;

async function expectAsync(fn: () => Promise<any>): Promise<ExpectAssertion> {
  try {
    const res = await fn();
    return expect(() => res);
  } catch (err) {
    return expect(() => {
      throw err;
    });
  }
}

async function expectAsyncToNotThrow(fn: () => Promise<any>): Promise<void> {
  const expectResult = await expectAsync(fn);
  // tslint:disable-next-line:no-unused-expression-chai
  expectResult.to.not.throw;
}

describe('AxePuppeteer', function () {
  before(async function (this) {
    this.timeout(10000);

    const args = [];
    if (process.env.CI) {
      args.push('--no-sandbox', '--disable-setuid-sandbox');
    }
    this.browser = await Puppeteer.launch({ args });
  });
  after(async function () {
    await this.browser.close();
  });
  beforeEach(async function () {
    this.page = await this.browser.newPage();
  });
  afterEach(async function () {
    await this.page.close();
  });
  before(async function () {
    // const app: express.Application = express()
    const app: express.Application = express();
    app.use(express.static(path.resolve(__dirname, 'fixtures')));
    this.server = createServer(app);
    this.addr = await testListen(this.server);

    this.fixtureFileURL = (filename: string): string => {
      return `${this.addr}/${filename}`;
    };
  });
  after(function () {
    this.server.close();
  });

  describe('convenience constructor', function () {
    it('handles creating a page for you', async function () {
      const url = this.fixtureFileURL('index.html');
      const results = await (await loadPage(this.browser, url)).analyze();

      expect(results).to.exist;
    });

    it('closes the page for you', async function () {
      // Grab the original `newPage` method
      const newPage = this.browser.newPage.bind(this.browser);
      let pageCloseSpy: SinonSpy | undefined;

      // Stub `Browser::newPage`
      const newPageStub: sinon.SinonStub = sinon.stub(this.browser, 'newPage');
      // Stub Calls the original, but adds a spy to the returned `Page`'s `close` method
      newPageStub.callsFake(async () => {
        const page = await newPage.bind(this.browser)();
        pageCloseSpy = sinon.spy(page, 'close');
        return page;
      });

      try {
        const url = this.fixtureFileURL('index.html');
        const results = await (await loadPage(this.browser, url)).analyze();

        expect(results).to.exist;
        expect(pageCloseSpy).to.exist.and.have.property('called').that.is.true;
      } finally {
        // Make sure to restore `Browser::newPage`
        newPageStub.restore();
      }
    });
  });

  describe('constructor', function () {
    it('accepts a Page', async function () {
      await this.page.goto(this.fixtureFileURL('index.html'));
      const axePup = new AxePuppeteer(this.page);
      await expectAsyncToNotThrow(() => axePup.analyze());
    });

    it('accepts a Frame', async function () {
      await this.page.goto(this.fixtureFileURL('index.html'));
      const axePup = new AxePuppeteer(this.page.mainFrame());
      await expectAsyncToNotThrow(() => axePup.analyze());
    });

    it('accepts custom axe-core source', async function () {
      const axeSource = `
        window.axe = {
          run: () => new Promise(resolve => resolve({})),
          configure: () => {}
        }
      `;

      await this.page.goto(this.fixtureFileURL('index.html'));

      const evalSpy: SinonSpy = sinon.spy(this.page.mainFrame(), 'evaluate');

      await new AxePuppeteer(this.page, axeSource).analyze();

      assert(evalSpy.calledWith(axeSource));
    });
    // TODO: Defaults to using the bundled axe-core source
  });

  it('injects into nexted frames', async function () {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'));

    const spies = this.page
      .frames()
      .map((frame: Frame) => sinon.spy(frame, 'addScriptTag'));

    await new AxePuppeteer(this.page).analyze();

    const calledSpies = spies
      .map((spy: SinonSpy) => spy.called)
      .filter((called: boolean) => called);
    expect(calledSpies).to.have.lengthOf(4);
  });

  it('injects into nexted frames... when given a Frame', async function () {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'));

    const spies = this.page
      .frames()
      .map((frame: Frame) => sinon.spy(frame, 'addScriptTag'));

    await new AxePuppeteer(this.page.mainFrame()).analyze();

    const calledSpies = spies
      .map((spy: SinonSpy) => spy.called)
      .filter((called: boolean) => called);
    expect(calledSpies).to.have.lengthOf(4);
  });

  it('runs in nested frames', async function() {
    await this.page.goto(this.fixtureFileURL('nested-frames.html'))

    const results = await new AxePuppeteer(this.page)
      .analyze()

    const flatResults = [
      ...results.passes,
      ...results.incomplete,
      ...results.inapplicable,
      ...results.violations
    ]


    expect(results.violations.find((r: Axe.Result) => r.id === 'label'))
      .to.not.be.undefined
  })


  it('injects custom axe source into nexted frames', async function () {
    const axeSource = `
      window.axe = {
        run: () => Promise.resolve({}),
        configure: () => {}
      }
    `;

    await this.page.goto(this.fixtureFileURL('nested-frames.html'));

    const defaultInjectSpies = this.page
      .frames()
      .map((frame: Frame) => sinon.spy(frame, 'addScriptTag'));
    const evalSpies = this.page
      .frames()
      .map((frame: Frame) => sinon.spy(frame, 'evaluate'));

    await new AxePuppeteer(this.page, axeSource).analyze();

    const calledDefaultSpies = defaultInjectSpies
      .map((spy: SinonSpy) => spy.called)
      .filter((called: boolean) => called);
    expect(calledDefaultSpies).to.have.lengthOf(0);

    const customInjectedSpies = evalSpies
      .map((spy: SinonSpy) => spy.calledWith(axeSource))
      .filter((called: boolean) => called);
    expect(customInjectedSpies).to.have.lengthOf(4);
  });

  // TODO: Disbale frames?

  it("returns results through analyze's promise", async function () {
    await this.page.goto(this.fixtureFileURL('index.html'));
    const results = await new AxePuppeteer(this.page).analyze();
    expect(results).to.exist;
    expect(results).to.have.property('passes');
    expect(results).to.have.property('incomplete');
    expect(results).to.have.property('inapplicable');
    expect(results).to.have.property('violations');
  });

  it('returns results through the callback if passed', async function () {
    await this.page.goto(this.fixtureFileURL('index.html'));
    await new AxePuppeteer(this.page).analyze((err, results) => {
      expect(err).to.be.null;

      expect(results).to.exist;
      expect(results).to.have.property('passes');
      expect(results).to.have.property('incomplete');
      expect(results).to.have.property('inapplicable');
      expect(results).to.have.property('violations');
    });
  });

  it('lets axe-core errors bubble when using promise API', async function () {
    const axeSource = `
      window.axe = {
        run: () => Promise.reject(new Error('boom')),
        configure: () => {}
      }
    `;

    await this.page.goto(this.fixtureFileURL('index.html'));

    const axePup = new AxePuppeteer(this.page, axeSource);
    (await expectAsync(async () => axePup.analyze())).to.throw('boom');
  });

  it('passes axe-core errors when using callback API', async function () {
    const axeSource = `
      window.axe = {
        run: () => Promise.reject(new Error('boom')),
        configure: () => {}
      }
    `;

    await this.page.goto(this.fixtureFileURL('index.html'));

    await new AxePuppeteer(this.page, axeSource).analyze(err => {
      expect(err)
        .to.exist.and.be.instanceof(Error)
        .and.have.property('message')
        .that.includes('boom');
    });
  });

  describe('context', function () {
    describe('with include and exclude', function () {
      it('passes both .include and .exclude', async function () {
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

        await this.page.goto(this.fixtureFileURL('context.html'));

        const axePip = new AxePuppeteer(this.page, axeSource)
          .include('.include')
          .exclude('.exclude');

        await expectAsyncToNotThrow(() => axePip.analyze());
      });
    });

    // See #58
    describe('excluded with an array of strings', () => {
      it('properly sets context.exclude', async function () {
        const expected = ['.foo', '.bar', '.baz', '.qux'];

        const axeSource = `
          window.axe = {
            configure(){},
            run({ exclude }){
              return Promise.resolve({ exclude })
            }
          }
        `;

        await this.page.goto(this.fixtureFileURL('context.html'));

        const axePip = new AxePuppeteer(this.page, axeSource)
          .include('.include')
          .exclude(['.foo', '.bar', '.baz', '.qux']);

        const { exclude: actual } = (await axePip.analyze()) as any;
        assert.deepEqual(actual[0], expected);
      });
    });

    describe('with only include', function () {
      it('adds .include to context', async function () {
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

        await this.page.goto(this.fixtureFileURL('context.html'));

        const axePip = new AxePuppeteer(this.page, axeSource).include(
          '.include'
        );

        await expectAsyncToNotThrow(() => axePip.analyze());
      });
    });

    describe('with only exclude', function () {
      it('adds .exclude to context', async function () {
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

        await this.page.goto(this.fixtureFileURL('context.html'));

        const axePip = new AxePuppeteer(this.page, axeSource).exclude(
          '.exclude'
        );

        await expectAsyncToNotThrow(() => axePip.analyze());
      });
    });

    it('defaults to document', async function () {
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

      await this.page.goto(this.fixtureFileURL('context.html'));

      const axePip = new AxePuppeteer(this.page, axeSource);

      await expectAsyncToNotThrow(() => axePip.analyze());
    });
  });

  describe('configure', function () {
    it('accepts custom configuration', async function () {
      const config: Axe.Spec = {
        checks: [
          {
            evaluate: (): false => false,
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

      await this.page.goto(this.fixtureFileURL('index.html'));

      // HACK: work around axe-core (incorrectly) requiring this to be
      // a function (see https://github.com/dequelabs/axe-core/issues/974).
      (config.checks as any)[0].evaluate = 'function () { return false }';

      const results = await new AxePuppeteer(this.page)
        .configure(config)
        .withRules(['foo'])
        .analyze();

      expect(results).to.have.property('passes').with.lengthOf(0);
      expect(results).to.have.property('incomplete').with.lengthOf(0);
      expect(results).to.have.property('inapplicable').with.lengthOf(0);
      expect(results).to.have.property('violations').with.lengthOf(1);
      expect(results.violations[0]).to.have.property('id', 'foo');
    });

    it('gives a helpful error when not passed an object', function () {
      const axePup = new AxePuppeteer(this.page);

      // Cast a string to a Spec to simulate incorrect usage with Javascript.
      const jsNotASpec = ('not an object' as unknown) as Axe.Spec;
      expect(() => axePup.configure(jsNotASpec)).to.throw('needs an object');
    });
  });

  describe('options', function () {
    it('passes options to axe-core', async function () {
      await this.page.goto(this.fixtureFileURL('index.html'));

      const results = await new AxePuppeteer(this.page)
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

  describe('withTags', function () {
    it('only rules with the given tag(s)', async function () {
      await this.page.goto(this.fixtureFileURL('index.html'));

      const results = await new AxePuppeteer(this.page)
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

  describe('withRules', function () {
    it('only rules with the given rule(s)', async function () {
      await this.page.goto(this.fixtureFileURL('index.html'));

      const results = await new AxePuppeteer(this.page)
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

  describe('disableRules', function () {
    it('disables the given rule(s)', async function () {
      await this.page.goto(this.fixtureFileURL('index.html'));

      const results = await new AxePuppeteer(this.page)
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

  describe('disableFrame', function() {
    it('disables the given rule(s)', async function() {
      await this.page.goto(this.fixtureFileURL('nested-frames.html'))

      const results = await new AxePuppeteer(this.page)
        // Disable the `region` rule
        .disableFrame("#topLevel")
        .analyze()

      const flatResults = [
        ...results.passes,
        ...results.incomplete,
        ...results.inapplicable,
        ...results.violations
      ]


      expect(results.violations.find((r: Axe.Result) => r.id === 'label'))
        .to.be.undefined
    })
  })

  describe("when given a page that hasn't loaded", function () {
    it('gives a helpful error', async function () {
      let addr = '';

      const server = createServer((req: any, res: any) => {
        const html = `
          <html>
            <body>
              <script async src="${addr}/wait.js"></script>
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
      addr = await testListen(server);

      const gotoP = this.page.goto(`${addr}/index.html`);
      const axePup = new AxePuppeteer(this.page);
      (await expectAsync(() => axePup.analyze())).to.throw('not ready');

      gotoP.catch(() => ({}));
      server.close();
    });
  });
});
