import expect from 'expect'
import React, { Children, PropTypes, Component } from 'react'
import TestUtils from 'react-addons-test-utils'
import { themr } from '../../src/index'

describe('Themr decorator function', () => {
  class Passthrough extends Component {
    render() {
      return <div {...this.props} />
    }
  }

  class ProviderMock extends Component {
    static childContextTypes = {
      themr: PropTypes.object.isRequired
    }

    getChildContext() {
      return { themr: { theme: this.props.theme } }
    }

    render() {
      return Children.only(this.props.children)
    }
  }

  it('passes the context theme object through the context', () => {
    const theme = { Container: { foo: 'foo_1234' } };

    @themr('Container')
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container />
      </ProviderMock>
    )

    const container = TestUtils.findRenderedComponentWithType(tree, Container)
    expect(container.context.themr.theme).toBe(theme)
  })

  it('passes the context component theme through a theme prop', () => {
    const containerTheme = { foo: 'foo_1234' };
    const theme = { Container: containerTheme };

    @themr('Container')
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container />
      </ProviderMock>
    )

    const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough)
    expect(stub.props.theme).toEqual(containerTheme);
  })

  it('passes a composed theme from context and props theme', () => {
    const containerTheme = { foo: 'foo_123' };
    const containerTheme2 = { foo: 'foo_567' };
    const theme = { Container: containerTheme };

    @themr('Container')
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container theme={containerTheme2} />
      </ProviderMock>
    )

    const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough);
    const expectedTheme = { foo: 'foo_123 foo_567' };
    expect(stub.props.theme).toEqual(expectedTheme);
  })

  it('passes a theme given via props when compose is disabled', () => {
    const containerTheme = { foo: 'foo_123' };
    const containerTheme2 = { foo: 'foo_567' };
    const theme = { Container: containerTheme };

    @themr('Container')
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container theme={containerTheme2} composeTheme={false} />
      </ProviderMock>
    )

    const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough);
    expect(stub.props.theme).toEqual(containerTheme2);
  })

  it('disables theme composition from decorator options', () => {
    const containerTheme = { foo: 'foo_123' };
    const containerTheme2 = { foo: 'foo_567' };
    const theme = { Container: containerTheme };

    @themr('Container', null, { composeTheme: false })
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container theme={containerTheme2} />
      </ProviderMock>
    )

    const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough);
    expect(stub.props.theme).toEqual(containerTheme2);
  })

  it('passes a composed theme from context, local and props', () => {
    const containerTheme = { foo: 'foo_123' };
    const containerThemeLocal = { foo: 'foo_567' };
    const containerThemeProps = { foo: 'foo_89' };
    const theme = { Container: containerTheme };

    @themr('Container', containerThemeLocal)
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container theme={containerThemeProps} />
      </ProviderMock>
    )

    const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough);
    const expectedTheme = { foo: 'foo_123 foo_567 foo_89' };
    expect(stub.props.theme).toEqual(expectedTheme);
  })

  it('passes the local theme when composition is disabled and no theme is given via props', () => {
    const containerTheme = { foo: 'foo_123' };
    const containerThemeLocal = { foo: 'foo_567' };
    const theme = { Container: containerTheme };

    @themr('Container', containerThemeLocal, { composeTheme: false })
    class Container extends Component {
      render() {
        return <Passthrough {...this.props} />
      }
    }

    const tree = TestUtils.renderIntoDocument(
      <ProviderMock theme={theme}>
        <Container />
      </ProviderMock>
    )

    const stub = TestUtils.findRenderedComponentWithType(tree, Passthrough);
    expect(stub.props.theme).toEqual(containerThemeLocal);
  })
})
