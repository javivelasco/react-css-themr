import * as React from "react";

declare module "react-css-themr" {
  type TReactCSSThemrTheme = {
    [key: string]: string | TReactCSSThemrTheme
  }

  export function themeable(...themes: Array<TReactCSSThemrTheme>): TReactCSSThemrTheme;

  export interface IThemrOptions {
    /** @default "deeply" */
    composeTheme?: "deeply" | "softly" | false,
  }

  export interface ThemeProviderProps {
    innerRef?: Function,
    theme: {}
  }

  export class ThemeProvider extends React.Component<ThemeProviderProps, any> {
  }

  interface ThemedComponent<P, S> extends React.Component<P, S> {
  }

  interface ThemedComponentClass<P, S> extends React.ComponentClass<P> {
    new(props?: P, context?: any): ThemedComponent<P, S>;
  }

  type TThemrDecorator = <P, S>(component: React.ComponentClass<P> | React.SFC<P>) => ThemedComponentClass<P, S>;

  export function themr(identifier: string | number | symbol,
                        defaultTheme?: {},
                        options?: IThemrOptions): TThemrDecorator;
}
