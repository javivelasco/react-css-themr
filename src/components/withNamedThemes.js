import React from 'react'
import PropTypes from 'prop-types'
import themr from './themr'

const getNamedTheme = (themesByName, nameOrTheme) => {
  let namedTheme

  if (
    typeof nameOrTheme === 'string' &&
    typeof themesByName === 'object' &&
    themesByName !== null &&
    typeof themesByName[nameOrTheme] === 'object' &&
    themesByName[nameOrTheme] !== null
  ) {
    namedTheme = themesByName[nameOrTheme]
  } else if (typeof nameOrTheme === 'object' && nameOrTheme !== null) {
    namedTheme = nameOrTheme
  }

  return namedTheme
}

const isThemeProp = themeProp =>
  typeof themeProp === 'string' ||
  (typeof themeProp === 'object' && themeProp !== null)

const withNamedThemes = (elementName, themesByName, defaultThemeName) => Element => {
  const ThemeableElementDisplayName = `Themed${elementName || Element.displayName || 'Element'}WithNamedThemes`

  const NamedThemeElementWrapper = ({ theme, ...rest }) => {
    let firstThemeProp
    let secondThemeProp

    if (Array.isArray(theme) === true && theme.length >= 1) {
      if (isThemeProp(theme[0]) === true) {
        firstThemeProp = theme[0]
      }

      if (isThemeProp(theme[1]) === true) {
        secondThemeProp = theme[1]
      }
    } else {
      const possibleFirstThemeProp = theme || defaultThemeName || Element.defaultProps.theme
      if (isThemeProp(possibleFirstThemeProp) === true) {
        firstThemeProp = possibleFirstThemeProp
      }
    }

    const firstTheme = getNamedTheme(themesByName, firstThemeProp)
    const secondTheme = getNamedTheme(themesByName, secondThemeProp)

    const ThemedElement = themr(ThemeableElementDisplayName, firstTheme)(Element)
    const themedElementProps = {
      ...rest,
      theme: secondTheme
    }

    return <ThemedElement {...themedElementProps} />
  }

  NamedThemeElementWrapper.propTypes = {
    theme: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.object, // eslint-disable-line react/forbid-prop-types
        PropTypes.string
      ])),
      PropTypes.object, // eslint-disable-line react/forbid-prop-types
      PropTypes.string
    ])
  }

  NamedThemeElementWrapper.defaultProps = {
    theme: undefined
  }

  return NamedThemeElementWrapper
}

export default withNamedThemes
