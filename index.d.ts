import * as React from "react";

declare module "react-css-themr" {
  type TReactCSSThemrTheme = {
    [key: string]: string | TReactCSSThemrTheme
  }
  type TMapThemrProps<P> = (ownProps: P, theme: TReactCSSThemrTheme) => P & { theme: TReactCSSThemrTheme }

  export function themeable(...themes: Array<TReactCSSThemrTheme>): TReactCSSThemrTheme;

  export interface IThemrOptions {
    /** @default "deeply" */
    composeTheme?: "deeply" | "softly" | false,
    //currently there's no way to lift decorated component's generic type argument (P) to upper decorator
    //that's why just {}
    mapThemrProps?: TMapThemrProps<{}>
  }

  export interface ThemeProviderProps {
    innerRef?: Function,
    theme: TReactCSSThemrTheme
  }

  export class ThemeProvider extends React.Component<ThemeProviderProps, any> {
  }

  interface ThemedComponent<P, S> extends React.Component<P, S> {
  }

  interface ThemedComponentClass<P, S> extends React.ComponentClass<P> {
    new(props?: P, context?: any): ThemedComponent<P, S>;
  }

  export function themr(
    identifier: string | number | symbol,
    defaultTheme?: {},
    options?: IThemrOptions
  ): <P, S>(component: (new(props?: P, context?: any) => React.Component<P, S>) | React.SFC<P>) =>
    ThemedComponentClass<P & { mapThemrProps?: TMapThemrProps<P> }, S>;
}
