import React, { Component, PropTypes } from 'react'
import invariant from 'invariant'

const COMPOSE_DEEPLY = 'deeply'
const COMPOSE_SOFTLY = 'softly'
const DONT_COMPOSE = false

const DEFAULT_OPTIONS = {
  composeTheme: COMPOSE_DEEPLY,
  withRef: false
}

const THEMR_CONFIG = typeof Symbol !== 'undefined' ?
  Symbol('THEMR_CONFIG') :
  '__REACT_CSS_THEMR_CONFIG__'

export default (componentName, localTheme, options = {}) => (ThemedComponent) => {
  const { composeTheme: optionComposeTheme, withRef: optionWithRef } = { ...DEFAULT_OPTIONS, ...options }
  validateComposeOption(optionComposeTheme)

  let config = ThemedComponent[THEMR_CONFIG]
  if (config && config.componentName === componentName) {
    config.localTheme = themeable(config.localTheme, localTheme)
    return ThemedComponent
  }

  config = {
    componentName,
    localTheme
  }

  class Themed extends Component {
    static displayName = `Themed${ThemedComponent.name}`;

    static contextTypes = {
      themr: PropTypes.object
    }

    static propTypes = {
      ...ThemedComponent.propTypes,
      composeTheme: PropTypes.oneOf([ COMPOSE_DEEPLY, COMPOSE_SOFTLY, DONT_COMPOSE ]),
      theme: PropTypes.object,
      themeNamespace: PropTypes.string
    }

    static defaultProps = {
      ...ThemedComponent.defaultProps,
      composeTheme: optionComposeTheme
    }

    constructor(...args) {
      super(...args)
      this.theme_ = this.calcTheme(this.props)
    }

    getWrappedInstance() {
      invariant(optionWithRef,
        'To access the wrapped instance, you need to specify ' +
        '{ withRef: true } as the third argument of the themr() call.'
      )

      return this.refs.wrappedInstance
    }

    getNamespacedTheme(props) {
      const { themeNamespace, theme } = props
      if (!themeNamespace) return theme
      if (themeNamespace &&  !theme) throw new Error('Invalid themeNamespace use in react-css-themr. ' +
        'themeNamespace prop should be used only with theme prop.')

      return Object.keys(theme)
        .filter(key => key.startsWith(themeNamespace))
        .reduce((result, key) => ({ ...result, [removeNamespace(key, themeNamespace)]:  theme[key] }), {})
    }

    getThemeNotComposed(props) {
      if (props.theme) return this.getNamespacedTheme(props)
      if (config.localTheme) return config.localTheme
      return this.getContextTheme()
    }

    getContextTheme() {
      return this.context.themr
        ? this.context.themr.theme[config.componentName]
        : {}
    }

    getTheme(props) {
      return props.composeTheme === COMPOSE_SOFTLY
        ? {
          ...this.getContextTheme(),
          ...config.localTheme,
          ...this.getNamespacedTheme(props)
        }
        : themeable(
          themeable(this.getContextTheme(), config.localTheme),
          this.getNamespacedTheme(props)
        )
    }

    calcTheme(props) {
      const { composeTheme } = props
      return composeTheme
        ? this.getTheme(props)
        : this.getThemeNotComposed(props)
    }

    componentWillReceiveProps(nextProps) {
      if (
        nextProps.composeTheme !== this.props.composeTheme ||
        nextProps.theme !== this.props.theme ||
        nextProps.themeNamespace !== this.props.themeNamespace
      ) {
        this.theme_ = this.calcTheme(nextProps)
      }
    }

    render() {
      let renderedElement

      if (optionWithRef) {
        renderedElement = React.createElement(ThemedComponent, {
          ...this.props,
          ref: 'wrappedInstance',
          theme: this.theme_
        })
      } else {
        renderedElement = React.createElement(ThemedComponent, {
          ...this.props,
          theme: this.theme_
        })
      }

      return renderedElement
    }
  }

  Themed[THEMR_CONFIG] = config

  return Themed
}

export function themeable(style = {}, theme) {
  if (!theme) return style
  return Object.keys(theme).reduce((result, key) => ({
    ...result, [key]: style[key] ? `${style[key]} ${theme[key]}` : theme[key]
  }), style)
}

function validateComposeOption(composeTheme) {
  if ([ COMPOSE_DEEPLY, COMPOSE_SOFTLY, DONT_COMPOSE ].indexOf(composeTheme) === -1) {
    throw new Error(
      `Invalid composeTheme option for react-css-themr. Valid composition options\
 are ${COMPOSE_DEEPLY}, ${COMPOSE_SOFTLY} and ${DONT_COMPOSE}. The given\
 option was ${composeTheme}`
    )
  }
}

function removeNamespace(key, themeNamespace) {
  const capitalized = key.substr(themeNamespace.length)
  return capitalized.slice(0, 1).toLowerCase() + capitalized.slice(1)
}
