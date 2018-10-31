import React, { Component } from 'react'
import PropTypes from 'prop-types'
import hoistNonReactStatics from 'hoist-non-react-statics'
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
  composeTheme: COMPOSE_DEEPLY,
  mapThemrProps: defaultMapThemrProps
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
  const {
    composeTheme: optionComposeTheme,
    mapThemrProps: optionMapThemrProps
  } = { ...DEFAULT_OPTIONS, ...options }
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
      themeNamespace: PropTypes.string,
      mapThemrProps: PropTypes.func
    }

    static defaultProps = {
      ...ThemedComponent.defaultProps,
      composeTheme: optionComposeTheme,
      mapThemrProps: optionMapThemrProps
    }

    constructor(...args) {
      super(...args)
      this.theme_ = this.calcTheme()
    }

    getWrappedInstance() {
      invariant(true,
        'DEPRECATED: To access the wrapped instance, you have to pass ' +
        '{ innerRef: fn } and retrieve with a callback ref style.'
      )

      return this.refs.wrappedInstance
    }

    getNamespacedTheme() {
      const { themeNamespace, theme } = this.props
      if (!themeNamespace) return theme
      if (themeNamespace && !theme) throw new Error('Invalid themeNamespace use in react-css-themr. ' +
        'themeNamespace prop should be used only with theme prop.')

      return Object.keys(theme)
        .filter(key => key.startsWith(themeNamespace))
        .reduce((result, key) => ({ ...result, [removeNamespace(key, themeNamespace)]:  theme[key] }), {})
    }

    getThemeNotComposed() {
      const { theme } = this.props
      if (theme) return this.getNamespacedTheme()
      if (config.localTheme) return config.localTheme
      return this.getContextTheme()
    }

    getContextTheme() {
      return this.context.themr
        ? this.context.themr.theme[config.componentName]
        : {}
    }

    getTheme() {
      const { composeTheme } = this.props
      return composeTheme === COMPOSE_SOFTLY
        ? {
          ...this.getContextTheme(),
          ...config.localTheme,
          ...this.getNamespacedTheme()
        }
        : themeable(
          themeable(this.getContextTheme(), config.localTheme),
          this.getNamespacedTheme()
        )
    }

    calcTheme() {
      const { composeTheme } = this.props
      return composeTheme
        ? this.getTheme()
        : this.getThemeNotComposed()
    }

    shouldComponentUpdate(prevProps) {
      const { composeTheme, theme, themeNamespace } = this.props
      if (
        composeTheme !== prevProps.composeTheme ||
        theme !== prevProps.theme ||
        themeNamespace !== prevProps.themeNamespace
      ) {
        this.theme_ = this.calcTheme()
        return true
      }
      return false
    }

    render() {
      return React.createElement(
        ThemedComponent,
        this.props.mapThemrProps(this.props, this.theme_)
      )
    }
  }

  Themed[THEMR_CONFIG] = config

  return hoistNonReactStatics(Themed, ThemedComponent)
}

/**
 * Merges passed themes by concatenating string keys and processing nested themes
 *
 * @param {...TReactCSSThemrTheme} themes - Themes
 * @returns {TReactCSSThemrTheme} - Resulting theme
 */
export function themeable(...themes) {
  return themes.reduce((acc, theme) => merge(acc, theme), {})
}

/**
 * @param {TReactCSSThemrTheme} [original] - Original theme
 * @param {TReactCSSThemrTheme} [mixin] - Mixin theme
 * @returns {TReactCSSThemrTheme} - resulting theme
 */
function merge(original = {}, mixin = {}) {
  //make a copy to avoid mutations of nested objects
  //also strip all functions injected by isomorphic-style-loader
  const result = Object.keys(original).reduce((acc, key) => {
    const value = original[key]
    if (typeof value !== 'function') {
      acc[key] = value
    }
    return acc
  }, {})

  //traverse mixin keys and merge them to resulting theme
  Object.keys(mixin).forEach(key => {
    //there's no need to set any defaults here
    const originalValue = result[key]
    const mixinValue = mixin[key]

    switch (typeof mixinValue) {
      case 'object': {
        //possibly nested theme object
        switch (typeof originalValue) {
          case 'object': {
            //exactly nested theme object - go recursive
            result[key] = merge(originalValue, mixinValue)
            break
          }

          case 'undefined': {
            //original does not contain this nested key - just take it as is
            result[key] = mixinValue
            break
          }

          default: {
            //can't merge an object with a non-object
            throw new Error(`You are merging object ${key} with a non-object ${originalValue}`)
          }
        }
        break
      }

      case 'undefined': //fallthrough - handles accidentally unset values which may come from props
      case 'function': {
        //this handles issue when isomorphic-style-loader addes helper functions to css-module
        break //just skip
      }

      default: {
        //plain values
        switch (typeof originalValue) {
          case 'object': {
            //can't merge a non-object with an object
            throw new Error(`You are merging non-object ${mixinValue} with an object ${key}`)
          }

          case 'undefined': {
            //mixin key is new to original theme - take it as is
            result[key] = mixinValue
            break
          }
          case 'function': {
            //this handles issue when isomorphic-style-loader addes helper functions to css-module
            break //just skip
          }

          default: {
            //finally we can merge
            result[key] = originalValue.split(' ')
              .concat(mixinValue.split(' '))
              .filter((item, pos, self) => self.indexOf(item) === pos && item !== '')
              .join(' ')
            break
          }
        }
        break
      }
    }
  })

  return result
}

/**
 * Validates compose option
 *
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
 *
 * @param {String} key - Key
 * @param {String} themeNamespace - Theme namespace
 * @returns {String} - Key
 */
function removeNamespace(key, themeNamespace) {
  const capitalized = key.substr(themeNamespace.length)
  return capitalized.slice(0, 1).toLowerCase() + capitalized.slice(1)
}

/**
 * Maps props and theme to an object that will be used to pass down props to the
 * decorated component.
 *
 * @param {Object} ownProps - All props given to the decorated component
 * @param {Object} theme - Calculated then that should be passed down
 * @returns {Object} - Props that will be passed down to the decorated component
 */
function defaultMapThemrProps(ownProps, theme) {
  const {
    composeTheme,   //eslint-disable-line no-unused-vars
    innerRef,
    themeNamespace, //eslint-disable-line no-unused-vars
    mapThemrProps,  //eslint-disable-line no-unused-vars
    ...rest
  } = ownProps

  return {
    ...rest,
    ref: innerRef,
    theme
  }
}
