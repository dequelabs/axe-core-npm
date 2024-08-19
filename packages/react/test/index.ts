import reactAxe from '../';
import React from 'react';
import ReactDOM from 'react-dom';

// default use
reactAxe(React, ReactDOM, 1000);

// axe-core spec
reactAxe(React, ReactDOM, 1000, {
  checks: [
    {
      id: 'my-check',
      evaluate() {}
    }
  ],
  rules: [
    {
      id: 'my-rule',
      any: ['my-check']
    }
  ]
});

const context = document.createElement('div');

// readOnly feature
reactAxe(React, ReactDOM, 1000, {
  runOnly: ['wcag2aa', 'wcag2a']
});

// axe-core context: Node
reactAxe(React, ReactDOM, 1000, {}, context);

// axe-core context: string
reactAxe(React, ReactDOM, 1000, {}, '#container');

// context/config: undefined
reactAxe(React, ReactDOM, 1000, undefined, undefined);

// context/config: null
reactAxe(React, ReactDOM, 1000);

// axe-core context: ContextObject
reactAxe(
  React,
  ReactDOM,
  1000,
  {},
  {
    include: [['#container']]
  }
);

// return type
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const promise: Promise<void> = reactAxe(React, ReactDOM, 1000);
