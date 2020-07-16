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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
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

// axe-core context: Node
reactAxe(React, ReactDOM, 1000, {}, context);

// axe-core context: string
reactAxe(React, ReactDOM, 1000, {}, '#container');

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
const promise: Promise<void> = reactAxe(React, ReactDOM, 1000);
