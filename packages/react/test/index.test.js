import React from 'react';
import ReactDOM from 'react-dom';
import ShadowDOM from 'react-shadow';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { assert } from 'chai';
import axe from 'axe-core';
import reactAxe, { logToConsole } from '../dist/index.js';
import cache from '../dist/cache.js';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: '' };
  }

  render() {
    return <button>{this.state.text}</button>;
  }
}

class ShadowApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { text: '' };
  }

  render() {
    // add App as global variable so we can call setState
    // @see https://mtm.dev/update-component-state-outside-react
    return (
      <ShadowDOM.div id="shadow-elm">
        <App
          ref={AppComp => {
            window.AppComp = AppComp;
          }}
        />
      </ShadowDOM.div>
    );
  }
}

let consoleLogStub;
let consoleErrorStub;
let groupStub;
let groupCollapsedStub;

let mountedComps;

function stubConsole() {
  consoleLogStub = sinon.stub(console, 'log');
  consoleErrorStub = sinon.stub(console, 'error');
  groupStub = sinon.stub(console, 'group');
  groupCollapsedStub = sinon.stub(console, 'groupCollapsed');
}

describe(`@axe-core/react using react@${React.version}`, () => {
  const divWrapper = document.createElement('div');

  beforeEach(() => {
    mountedComps = [];
    document.body.appendChild(divWrapper);
  });

  afterEach(() => {
    cache.clear();
    axe.reset();

    divWrapper.remove();
    mountedComps.forEach(comp => comp.unmount());

    if (consoleLogStub?.restore) {
      consoleLogStub.restore();
    }
    if (consoleErrorStub?.restore) {
      consoleErrorStub.restore();
    }
    if (groupStub?.restore) {
      groupStub.restore();
    }
    if (groupCollapsedStub?.restore) {
      groupCollapsedStub.restore();
    }
  });

  it('should run axe and call the logger with the results', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));

    const logger = sinon.stub();
    await reactAxe(React, ReactDOM, 1000, undefined, undefined, logger);

    assert.isTrue(
      logger.calledWith(
        sinon.match({
          passes: sinon.match.array,
          violations: sinon.match.array,
          incomplete: sinon.match.array,
          inapplicable: sinon.match.array,
          testEngine: {
            name: 'axe-core',
            version: axe.version
          }
        })
      )
    );
  });

  it('should deduplicate results', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));

    const logger = sinon.stub();
    await reactAxe(React, ReactDOM, 1000, undefined, undefined, logger);
    logger.resetHistory();
    await reactAxe(React, ReactDOM, 1000, undefined, undefined, logger);

    assert.isFalse(logger.called);
  });

  it('should not deduplicate results with disableDeduplicate', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));

    const logger = sinon.stub();
    await reactAxe(React, ReactDOM, 1000, undefined, undefined, logger);
    logger.resetHistory();
    await reactAxe(
      React,
      ReactDOM,
      1000,
      { disableDeduplicate: true },
      undefined,
      logger
    );

    assert.isTrue(logger.called);
  });

  it('should configure axe', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));

    const logger = sinon.stub();
    const config = {
      rules: [{ id: 'button-name', enabled: true }],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config, undefined, logger);

    const results = logger.firstCall.firstArg;
    assert.lengthOf(results.violations, 1);
    assert.lengthOf(results.passes, 0);
    assert.lengthOf(results.incomplete, 0);
    assert.lengthOf(results.inapplicable, 0);
  });

  it('should configure axe with runOnly (tags)', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));

    const logger = sinon.stub();

    // first prove there are non-wcag2a rules returned
    await reactAxe(React, ReactDOM, 1000, undefined, undefined, logger);

    let results = logger.firstCall.firstArg;
    let rules = [
      ...results.passes,
      ...results.violations,
      ...results.incomplete,
      ...results.inapplicable
    ];

    assert.isTrue(rules.length > 0);
    assert.isFalse(rules.every(rule => rule.tags.includes('wcag2a')));

    // now prove config fixes that
    logger.resetHistory();
    await reactAxe(
      React,
      ReactDOM,
      1000,
      {
        runOnly: ['wcag2a'],
        disableDeduplicate: true
      },
      undefined,
      logger
    );

    results = logger.firstCall.firstArg;
    rules = [
      ...results.passes,
      ...results.violations,
      ...results.incomplete,
      ...results.inapplicable
    ];

    assert.isTrue(rules.length > 0);
    assert.isTrue(rules.every(rule => rule.tags.includes('wcag2a')));
  });

  it('should only call the logger when there are violations', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));

    const logger = sinon.stub();
    const config = {
      rules: [{ id: 'heading-order', enabled: true }],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config, undefined, logger);

    assert.isFalse(logger.called);
  });

  it('should output violations to the console', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));
    stubConsole();

    const config = {
      rules: [{ id: 'button-name', enabled: true }],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config);
    const groupArgs = groupStub.firstCall.args.join(':');
    const groupCollapsedArgs = groupCollapsedStub.firstCall.args.join(':');

    assert.isTrue(groupArgs.includes('New axe issue'));
    assert.isTrue(groupCollapsedArgs.includes('button-name'));
  });

  it('should output the violation node to the console', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));
    stubConsole();

    const config = {
      checks: [
        {
          id: 'failure',
          evaluate: () => {
            return false;
          }
        }
      ],
      rules: [
        {
          id: 'failure',
          enabled: true,
          any: ['failure']
        }
      ],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config);
    const logArgs = consoleLogStub.firstCall.args.join(':');

    assert.isTrue(logArgs.includes('<button></button>'));
  });

  it('should change color of console message based on impact (critical)', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));
    stubConsole();

    const config = {
      checks: [
        {
          id: 'critical',
          evaluate: () => {
            return false;
          },
          metadata: {
            impact: 'critical',
            messages: {
              pass: 'passed',
              fail: 'failed'
            }
          }
        }
      ],
      rules: [
        {
          id: 'critical',
          enabled: true,
          any: ['critical']
        }
      ],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config);
    const groupCollapsedArgs = groupCollapsedStub.firstCall.args.join(':');

    assert.isTrue(groupCollapsedArgs.includes('critical'));
    assert.isTrue(
      groupCollapsedArgs.includes('color:#d93251;font-weight:bold;')
    );
  });

  it('should change color of console message based on impact (serious)', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));
    stubConsole();

    const config = {
      checks: [
        {
          id: 'serious',
          evaluate: () => {
            return false;
          },
          metadata: {
            impact: 'serious',
            messages: {
              pass: 'passed',
              fail: 'failed'
            }
          }
        }
      ],
      rules: [
        {
          id: 'serious',
          enabled: true,
          any: ['serious']
        }
      ],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config);
    const groupCollapsedArgs = groupCollapsedStub.firstCall.args.join(':');

    assert.isTrue(groupCollapsedArgs.includes('serious'));
    assert.isTrue(
      groupCollapsedArgs.includes('color:#d93251;font-weight:normal;')
    );
  });

  it('should change color of console message based on impact (moderate)', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));
    stubConsole();

    const config = {
      checks: [
        {
          id: 'moderate',
          evaluate: () => {
            return false;
          },
          metadata: {
            impact: 'moderate',
            messages: {
              pass: 'passed',
              fail: 'failed'
            }
          }
        }
      ],
      rules: [
        {
          id: 'moderate',
          enabled: true,
          any: ['moderate']
        }
      ],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config);
    const groupCollapsedArgs = groupCollapsedStub.firstCall.args.join(':');

    assert.isTrue(groupCollapsedArgs.includes('moderate'));
    assert.isTrue(
      groupCollapsedArgs.includes('color:#d24700;font-weight:bold;')
    );
  });

  it('should change color of console message based on impact (minor)', async () => {
    mountedComps.push(mount(<App />, { attachTo: divWrapper }));
    stubConsole();

    const config = {
      checks: [
        {
          id: 'minor',
          evaluate: () => {
            return false;
          },
          metadata: {
            impact: 'minor',
            messages: {
              pass: 'passed',
              fail: 'failed'
            }
          }
        }
      ],
      rules: [
        {
          id: 'minor',
          enabled: true,
          any: ['minor']
        }
      ],
      disableOtherRules: true
    };

    await reactAxe(React, ReactDOM, 1000, config);
    const groupCollapsedArgs = groupCollapsedStub.firstCall.args.join(':');

    assert.isTrue(groupCollapsedArgs.includes('minor'));
    assert.isTrue(
      groupCollapsedArgs.includes('color:#d24700;font-weight:normal;')
    );
  });

  it('should call the logger when a component updates', done => {
    let trigger = false;
    const logger = sinon.stub().callsFake(() => {
      if (trigger) {
        try {
          assert.deepEqual(window.AppComp.state, { text: '    ' });
          assert.isTrue(logger.called);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
    const config = {
      rules: [{ id: 'button-name', enabled: true }],
      disableOtherRules: true
    };

    reactAxe(React, ReactDOM, 1000, config, undefined, logger).then(() => {
      try {
        mountedComps.push(
          mount(
            <App
              ref={AppComp => {
                window.AppComp = AppComp;
              }}
            />,
            { attachTo: divWrapper }
          )
        );

        logger.resetHistory();
        assert.isFalse(logger.called);
        trigger = true;
        window.AppComp.setState({ text: '    ' });
      } catch (err) {
        done(err);
      }
    });
  });

  it('should call the logger when component in Shadow DOM updates', done => {
    let trigger = false;
    const logger = sinon.stub().callsFake(() => {
      if (trigger) {
        try {
          assert.deepEqual(window.AppComp.state, { text: '    ' });
          assert.isTrue(logger.called);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
    const config = {
      rules: [{ id: 'button-name', enabled: true }],
      disableOtherRules: true
    };

    reactAxe(React, ReactDOM, 1000, config, undefined, logger).then(() => {
      try {
        mountedComps.push(mount(<ShadowApp />, { attachTo: divWrapper }));

        logger.resetHistory();
        trigger = true;
        window.AppComp.setState({ text: '    ' });
      } catch (err) {
        done(err);
      }
    });
  });

  it('should get common parent for multiple updates', done => {
    let trigger = false;
    const logger = sinon.stub().callsFake(results => {
      if (trigger) {
        try {
          // if axe was run on only a single node we would see only 1
          // node
          assert.lengthOf(results.violations[0].nodes, 2);
          done();
        } catch (err) {
          done(err);
        }
      }
    });
    const config = {
      rules: [{ id: 'button-name', enabled: true }],
      disableOtherRules: true
    };

    reactAxe(React, ReactDOM, 1000, config, undefined, logger).then(() => {
      try {
        const div1 = document.createElement('div');
        const div2 = document.createElement('div');
        divWrapper.appendChild(div1);
        divWrapper.appendChild(div2);

        mountedComps.push(
          mount(
            <App
              ref={comp => {
                window.AppComp1 = comp;
              }}
            />,
            { attachTo: div1 }
          )
        );
        mountedComps.push(
          mount(
            <App
              ref={comp => {
                window.AppComp2 = comp;
              }}
            />,
            { attachTo: div2 }
          )
        );

        logger.resetHistory();
        trigger = true;
        window.AppComp1.setState({ text: '    ' });
        window.AppComp2.setState({ text: '    ' });
      } catch (err) {
        done(err);
      }
    });
  });

  it('check to make sure logToConsole is exported', () => {
    assert.isFunction(logToConsole);
  });
});
