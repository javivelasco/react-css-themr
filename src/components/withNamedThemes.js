import React from 'react'
import PropTypes from 'prop-types'
import themr from './themr'

const withNamedThemes = (elementName, themesByName) => Element => {
  const ThemeableElementDisplayName = `Themed${elementName || Element.displayName || 'Element'}WithNamedThemes`

  const NamedThemeElementWrapper = ({ theme, ...rest }) => {
    let namedTheme
    const themeProp = theme || Element.defaultProps.theme

    if (
      typeof themeProp === 'string' &&
      typeof themesByName === 'object' &&
      themesByName !== null &&
      typeof themesByName[themeProp] === 'object' &&
      themesByName[themeProp] !== null
    ) {
      namedTheme = themesByName[themeProp]
    } else if (typeof themeProp === 'object' && themeProp !== null) {
      namedTheme = themeProp
    }

    const ThemedElement = themr(ThemeableElementDisplayName, namedTheme)(Element)

    return <ThemedElement {...rest} />
  }

  NamedThemeElementWrapper.propTypes = {
    theme: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object // eslint-disable-line react/forbid-prop-types
    ])
  }

  NamedThemeElementWrapper.defaultProps = {
    theme: undefined
  }

  return NamedThemeElementWrapper
}

export default withNamedThemes
