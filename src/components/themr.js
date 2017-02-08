import React, { Component, PropTypes } from 'react'
import invariant from 'invariant'

/**
 * @typedef {Object.<string, TReactCSSThemrTheme>} TReactCSSThemrTheme
 */

/**
 * @typedef {{}} TReactCSSThemrOptions
 * @property {String|Boolean} [composeTheme=COMPOSE_DEEPLY]
 */

const COMPOSE_DEEPLY = 'deeply'
const COMPOSE_SOFTLY = 'softly'
const DONT_COMPOSE = false

const DEFAULT_OPTIONS = {
  composeTheme: COMPOSE_DEEPLY
}

const THEMR_CONFIG = typeof Symbol !== 'undefined' ?
  Symbol('THEMR_CONFIG') :
  '__REACT_CSS_THEMR_CONFIG__'

/**
 * Themr decorator
 * @param {String|Number|Symbol} componentName - Component name
 * @param {TReactCSSThemrTheme} [localTheme] - Base theme
 * @param {{}} [options] - Themr options
 * @returns {function(ThemedComponent:Function):Function} - ThemedComponent
 */
export default (componentName, localTheme, options = {}) => (ThemedComponent) => {
  const { composeTheme: optionComposeTheme } = { ...DEFAULT_OPTIONS, ...options }
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

  /**
   * @property {{wrappedInstance: *}} refs
   */
  class Themed extends Component {
    static displayName = `Themed${ThemedComponent.name}`;

    static contextTypes = {
      themr: PropTypes.object
    }

    static propTypes = {
      ...ThemedComponent.propTypes,
      composeTheme: PropTypes.oneOf([ COMPOSE_DEEPLY, COMPOSE_SOFTLY, DONT_COMPOSE ]),
      innerRef: PropTypes.func,
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
      invariant(true,
        'DEPRECATED: To access the wrapped instance, you have to pass ' +
        '{ innerRef: fn } and retrieve with a callback ref style.'
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
      //exclude themr-only props
      //noinspection JSUnusedLocalSymbols
      const { composeTheme, innerRef, themeNamespace, ...props } = this.props //eslint-disable-line no-unused-vars

      return React.createElement(ThemedComponent, {
        ...props,
        ref: innerRef,
        theme: this.theme_
      })
    }
  }

  Themed[THEMR_CONFIG] = config

  return Themed
}

/**
 * Merges two themes by concatenating values with the same keys
 * @param {TReactCSSThemrTheme} [original] - Original theme object
 * @param {TReactCSSThemrTheme} [mixin] - Mixing theme object
 * @returns {TReactCSSThemrTheme} - Merged resulting theme
 */
export function themeable(original = {}, mixin) {
  //don't merge if no mixin is passed
  if (!mixin) return original

  //merge themes by concatenating values with the same keys
  return Object.keys(mixin).reduce(

    //merging reducer
    (result, key) => {

      const originalValue = typeof original[key] !== 'function'
        ? (original[key] || '')
        : ''
      const mixinValue = typeof mixin[key] !== 'function'
        ? (mixin[key] || '')
        : ''

      let newValue

      //when you are mixing an string with a object it should fail
      invariant(!(typeof originalValue === 'string' && typeof mixinValue === 'object'),
        `You are merging a string "${originalValue}" with an Object,` +
        'Make sure you are passing the proper theme descriptors.'
      )

      //check if values are nested objects
      if (typeof originalValue === 'object' && typeof mixinValue === 'object') {
        //go recursive
        newValue = themeable(originalValue, mixinValue)
      } else {
        //either concat or take mixin value
        newValue = originalValue.split(' ')
          .concat(mixinValue.split(' '))
          .filter((item, pos, self) => self.indexOf(item) === pos && item !== '')
          .join(' ')
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
