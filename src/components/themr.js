import React, { Component, PropTypes } from 'react'

const COMPOSE_DEEPLY = 'deeply'
const COMPOSE_SOFTLY = 'softly'
const DONT_COMPOSE = false

const DEFAULT_OPTIONS = {
  composeTheme: COMPOSE_DEEPLY
}

export default (componentName, localTheme, options = DEFAULT_OPTIONS) => (ThemedComponent) => {
  const { composeTheme: optionComposeTheme } = options
  validateComposeOption(optionComposeTheme)
  return class Themed extends Component {
    static displayName = `Themed ${ThemedComponent.name}`;

    static contextTypes = {
      themr: PropTypes.object
    }

    static propTypes = {
      composeTheme: PropTypes.oneOf([ COMPOSE_DEEPLY, COMPOSE_SOFTLY, DONT_COMPOSE ]),
      theme: PropTypes.object
    }

    static defaultProps = {
      composeTheme: optionComposeTheme
    }

    getThemeNotComposed() {
      if (this.props.theme) return this.props.theme
      if (localTheme) return localTheme
      return this.getContextTheme()
    }

    getContextTheme() {
      return this.context.themr
        ? this.context.themr.theme[componentName]
        : {}
    }

    getTheme() {
      return this.props.composeTheme === COMPOSE_SOFTLY
        ? Object.assign({}, this.getContextTheme(), localTheme, this.props.theme)
        : themeable(themeable(this.getContextTheme(), localTheme), this.props.theme)
    }

    render() {
      return React.createElement(ThemedComponent, {
        ...this.props,
        theme: this.props.composeTheme
          ? this.getTheme()
          : this.getThemeNotComposed()
      })
    }
  }
}

function themeable(style = {}, theme) {
  if (!theme) return style
  return [ ...Object.keys(theme), ...Object.keys(style) ].reduce((result, key) => (
    theme[key] && style[key] && theme[key].indexOf(style[key]) === -1
      ? { ...result, [key]: `${style[key]} ${theme[key]}` }
      : { ...result, [key]: theme[key] || style[key] }
  ), {})
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
