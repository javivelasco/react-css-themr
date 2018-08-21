import React, { Component } from 'react'
import PropTypes from 'prop-types'
import TestUtils from 'react-dom/test-utils'
import { ThemeProvider } from '../../src/index'
import { JSDOM } from 'jsdom'

const documentDom = new JSDOM(`<!doctype html><html><body></body></html>`)
beforeEach(() => {
  global.document = documentDom
  global.window = document.defaultView
  global.navigator = global.window.navigator

  jest.spyOn(console, 'error')
  global.console.error.mockImplementation(() => {})
})

afterEach(() => {
  global.console.error.mockRestore()
})

describe('ThemeProvider', () => {
  class Child extends Component {
    render() {
      return <div />
    }
  }

  Child.contextTypes = {
    themr: PropTypes.object.isRequired
  }

  test('enforces a single child', () => {
    const theme = {}

    // Ignore propTypes warnings
    const propTypes = ThemeProvider.propTypes
    ThemeProvider.propTypes = {}

    try {
      expect(() =>
        TestUtils.renderIntoDocument(
          <ThemeProvider theme={theme}>
            <div />
          </ThemeProvider>
        )
      ).not.toThrow()

      expect(() =>
        TestUtils.renderIntoDocument(
          <ThemeProvider theme={theme}>
            <div />
            <div />
          </ThemeProvider>
        )
      ).toThrow(/expected to receive a single React element child/)

      expect(() =>
        TestUtils.renderIntoDocument(<ThemeProvider theme={theme} />)
      ).toThrow(/expected to receive a single React element child/)
    } finally {
      ThemeProvider.propTypes = propTypes
    }
  })

  test('should add the theme to the child context', () => {
    const theme = {}

    TestUtils.renderIntoDocument(
      <ThemeProvider theme={theme}>
        <Child />
      </ThemeProvider>
    )

    const spy = jest.spyOn(console, 'error')
    const tree = TestUtils.renderIntoDocument(
      <ThemeProvider theme={theme}>
        <Child />
      </ThemeProvider>
    )
    expect(spy.mock.calls.length).toBe(0)

    const child = TestUtils.findRenderedComponentWithType(tree, Child)
    expect(child.context.themr.theme).toBe(theme)
  })
})
