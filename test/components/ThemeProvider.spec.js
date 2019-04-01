import React, { Component } from 'react'
import { render } from 'react-dom'
import expect from 'expect'
import TestUtils from 'react-dom/test-utils'
import { ThemeProvider } from '../../src/index'
import { ThemeContext } from '../../src/components/themr'

describe('ThemeProvider', () => {
  class Child extends Component {
    render() {
      return (
        <ThemeContext.Consumer>
          {data => JSON.stringify(data)}
        </ThemeContext.Consumer>
      )
    }
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
    const theme = { foo: 'bar' }

    TestUtils.renderIntoDocument(
      <ThemeProvider theme={theme}>
        <Child />
      </ThemeProvider>
    )

    const spy = expect.spyOn(console, 'error')
    const node = document.createElement('div')
    render(
      <ThemeProvider theme={theme}>
        <Child />
      </ThemeProvider>,
      node
    )
    spy.destroy()
    expect(spy.calls.length).toBe(0)

    expect(JSON.parse(node.innerHTML)).toEqual({ theme })
  })
})
