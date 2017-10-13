import expect from 'expect'
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import TestUtils from 'react-dom/test-utils'
import { ThemeProvider } from '../../src/index'

describe('ThemeProvider', () => {
  class Child extends Component {
    render() {
      return <div />
    }
  }

  Child.contextTypes = {
    themr: PropTypes.object.isRequired
  }

  it('enforces a single child', () => {
    const theme = {}

    // Ignore propTypes warnings
    const propTypes = ThemeProvider.propTypes
    ThemeProvider.propTypes = {}

    try {
      expect(() => TestUtils.renderIntoDocument(
        <ThemeProvider theme={theme}>
          <div />
        </ThemeProvider>
      )).toNotThrow()

      expect(() => TestUtils.renderIntoDocument(
        <ThemeProvider theme={theme}>
          <div />
          <div />
        </ThemeProvider>
      )).toThrow(/expected to receive a single React element child/)

      expect(() => TestUtils.renderIntoDocument(
        <ThemeProvider theme={theme}>
        </ThemeProvider>
      )).toThrow(/expected to receive a single React element child/)
    } finally {
      ThemeProvider.propTypes = propTypes
    }
  })

  it('should add the theme to the child context', () => {
    const theme = {}

    TestUtils.renderIntoDocument(
      <ThemeProvider theme={theme}>
        <Child />
      </ThemeProvider>
    )

    const spy = expect.spyOn(console, 'error')
    const tree = TestUtils.renderIntoDocument(
      <ThemeProvider theme={theme}>
        <Child />
      </ThemeProvider>
    )
    spy.destroy()
    expect(spy.calls.length).toBe(0)

    const child = TestUtils.findRenderedComponentWithType(tree, Child)
    expect(child.context.themr.theme).toBe(theme)
  })
})
