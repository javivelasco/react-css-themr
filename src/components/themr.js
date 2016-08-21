import React, { Component, PropTypes } from 'react'
import invariant from 'invariant'

const COMPOSE_DEEPLY = 'deeply'
const COMPOSE_SOFTLY = 'softly'
const DONT_COMPOSE = false

const DEFAULT_OPTIONS = {
  composeTheme: COMPOSE_DEEPLY,
  withRef: false
}

export default (componentName, localTheme, options = {}) => (ThemedComponent) => {
  const { composeTheme: optionComposeTheme, withRef: optionWithRef } = { ...DEFAULT_OPTIONS, ...options }
  validateComposeOption(optionComposeTheme)
  return class Themed extends Component {
    static displayName = `Themed ${ThemedComponent.name}`;

    static contextTypes = {
      themr: PropTypes.object
    }

    static propTypes = {
      composeTheme: PropTypes.oneOf([ COMPOSE_DEEPLY, COMPOSE_SOFTLY, DONT_COMPOSE ]),
      theme: PropTypes.object,
      namespace: PropTypes.string
    }

    static defaultProps = {
      composeTheme: optionComposeTheme
    }

    getWrappedInstance() {
      invariant(optionWithRef,
        'To access the wrapped instance, you need to specify ' +
        '{ withRef: true } as the third argument of the themr() call.'
      )

      return this.refs.wrappedInstance
    }

    getNamespacedTheme() {
      const { namespace, theme } = this.props
      if (!namespace) return theme
      if (namespace &&  !theme) throw new Error('Invalid namespace use in react-css-themr. ' +
        'Namespace prop should be used only with theme prop.')

      return Object.keys(theme)
        .filter(key => key.startsWith(namespace))
        .reduce((p, c) => ({ ...p, [removeNamespace(c, namespace)]:  theme[c] }), {})
    }

    getThemeNotComposed() {
      if (this.props.theme) return this.getNamespacedTheme()
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
        ? Object.assign({}, this.getContextTheme(), localTheme, this.getNamespacedTheme())
        : themeable(themeable(this.getContextTheme(), localTheme), this.getNamespacedTheme())
    }

    render() {
      const { composeTheme, ...rest } = this.props
      let renderedElement

      if (optionWithRef) {
        renderedElement = React.createElement(ThemedComponent, {
          ...rest,
          ref: 'wrappedInstance',
          theme: composeTheme
            ? this.getTheme()
            : this.getThemeNotComposed()
        })
      } else {
        renderedElement = React.createElement(ThemedComponent, {
          ...rest,
          theme: composeTheme
            ? this.getTheme()
            : this.getThemeNotComposed()
        })
      }

      return renderedElement
    }
  }
}

function themeable(style = {}, theme) {
  if (!theme) return style
  return Object.keys(theme).reduce((result, key) => (
    Object.assign(result, { [key]:
       style[key] && theme[key].indexOf(style[key]) === -1
       ? `${style[key]} ${theme[key]}`
       : theme[key] || style[key]
    })), Object.assign({}, style))
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

function removeNamespace(key, namespace) {
  const capitilized = key.substr(namespace.length)
  return capitilized.slice(0, 1).toLowerCase() + capitilized.slice(1)
}
