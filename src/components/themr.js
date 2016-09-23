import React, { Component, PropTypes } from 'react'
import invariant from 'invariant'

/**
 * @typedef {Object.<string, TReactCSSThemrTheme>} TReactCSSThemrTheme
 */

/**
 * @typedef {{}} TReactCSSThemrOptions
 * @property {String|Boolean} [composeTheme=COMPOSE_DEEPLY]
 * @property {Boolean} [withRef=false]
 */

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

/**
 * Themr decorator
 * @param {String|Number|Symbol} componentName - Component name
 * @param {TReactCSSThemrTheme} localTheme - Base theme
 * @param {{}} options - Themr options
 * @returns {function(ThemedComponent:Function):Function} - ThemedComponent
 */
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

    getWrappedInstance() {
      invariant(optionWithRef,
        'To access the wrapped instance, you need to specify ' +
        '{ withRef: true } as the third argument of the themr() call.'
      )

      return this.refs.wrappedInstance
    }

    getNamespacedTheme() {
      const { themeNamespace, theme } = this.props
      if (!themeNamespace) return theme
      if (themeNamespace &&  !theme) throw new Error('Invalid themeNamespace use in react-css-themr. ' +
        'themeNamespace prop should be used only with theme prop.')

      return Object.keys(theme)
        .filter(key => key.startsWith(themeNamespace))
        .reduce((result, key) => ({ ...result, [removeNamespace(key, themeNamespace)]:  theme[key] }), {})
    }

    getThemeNotComposed() {
      if (this.props.theme) return this.getNamespacedTheme()
      if (config.localTheme) return config.localTheme
      return this.getContextTheme()
    }

    getContextTheme() {
      return this.context.themr
        ? this.context.themr.theme[config.componentName]
        : {}
    }

    getTheme() {
      return this.props.composeTheme === COMPOSE_SOFTLY
        ? { ...this.getContextTheme(), ...config.localTheme, ...this.getNamespacedTheme() }
        : themeable(themeable(this.getContextTheme(), config.localTheme), this.getNamespacedTheme())
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

  Themed[THEMR_CONFIG] = config

  return Themed
}

/**
 * Merges two themes by concatenating values with the same keys
 * @param {TReactCSSThemrTheme} original - Original theme object
 * @param {TReactCSSThemrTheme} mixin - Mixing theme object
 * @returns {TReactCSSThemrTheme} - Merged resulting theme
 */
export function themeable(original = {}, mixin) {
  //don't merge if no mixin is passed
  if (!mixin) return original

  //merge themes by concatenating values with the same keys
  return Object.keys(mixin).reduce(

    //merging reducer
    (result, key) => {
      const originalValue = original[key]
      const mixinValue = mixin[key]

      let newValue

      //check if values are nested objects
      if (typeof originalValue === 'object' && typeof mixinValue === 'object') {
        //go recursive
        newValue = themeable(originalValue, mixinValue)
      } else {
        //either concat or take mixin value
        newValue = originalValue ? `${originalValue} ${mixinValue}` : mixinValue
      }

      return {
        ...result,
        [key]: newValue
      }
    },

    //use original theme as an acc
    original
  )
}

/**
 * Validates compose option
 * @param {String|Boolean} composeTheme - Compose them option
 * @throws
 * @returns {undefined}
 */
function validateComposeOption(composeTheme) {
  if ([ COMPOSE_DEEPLY, COMPOSE_SOFTLY, DONT_COMPOSE ].indexOf(composeTheme) === -1) {
    throw new Error(
      `Invalid composeTheme option for react-css-themr. Valid composition options\
 are ${COMPOSE_DEEPLY}, ${COMPOSE_SOFTLY} and ${DONT_COMPOSE}. The given\
 option was ${composeTheme}`
    )
  }
}

/**
 * Removes namespace from key
 * @param {String} key - Key
 * @param {String} themeNamespace - Theme namespace
 * @returns {String} - Key
 */
function removeNamespace(key, themeNamespace) {
  const capitalized = key.substr(themeNamespace.length)
  return capitalized.slice(0, 1).toLowerCase() + capitalized.slice(1)
}
