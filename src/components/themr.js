import React, { Component, PropTypes } from 'react';

const DEFAULT_OPTIONS = {
  composeTheme: true
};

export default (componentName, localTheme, options = DEFAULT_OPTIONS) => (ThemedComponent) => {
  const { composeTheme: optionComposeTheme } = options;
  return class Themed extends Component {
    static contextTypes = {
      themr: PropTypes.object
    };

    static propTypes = {
      composeTheme: PropTypes.bool,
      theme: PropTypes.object
    };

    static defaultProps = {
      composeTheme: optionComposeTheme
    };

    getTheme() {
      if (!this.props.composeTheme && this.props.theme) return this.props.theme;
      if (!this.props.composeTheme && localTheme) return localTheme;
      const contextTheme = localTheme
        ? themeable(this.context.themr.theme[componentName], localTheme)
        : this.context.themr.theme[componentName];
      return themeable(contextTheme, this.props.theme);
    }

    render () {
      return React.createElement(ThemedComponent, {
        ...this.props,
        theme: this.getTheme()
      });
    }
  }
};


function themeable(style = {}, theme) {
  if (!theme) return style;
  return [...Object.keys(theme), ...Object.keys(style)].reduce((result, key) => (
    theme[key] && style[key] && theme[key].indexOf(style[key]) === -1
      ? { ...result, [key]: `${style[key]} ${theme[key]}` }
      : { ...result, [key]: theme[key] || style[key] }
  ), {});
}
