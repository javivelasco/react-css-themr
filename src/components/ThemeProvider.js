import React, { Children } from 'react'
import { ThemeContext } from './themr'

export default function ThemeProvider(props) {
  return (
    <ThemeContext.Provider value={{ theme: props.theme }}>
      {Children.only(props.children)}
    </ThemeContext.Provider>
  )
}
