import * as React from "react";

declare module "react-css-themr"
{
	export interface IThemrOptions
	{
		/** @default "deeply" */
		composeTheme?: "deeply" | "softly" | false,
	}

	export interface ThemeProviderProps
	{
    innerRef?: Function,
		theme: {}
	}

	export class ThemeProvider extends React.Component<ThemeProviderProps, any>
	{

	}

	interface ThemedComponent<P, S> extends React.Component<P, S>
	{

	}

	interface ThemedComponentClass<P, S> extends React.ComponentClass<P>
	{
		new(props?: P, context?: any): ThemedComponent<P, S>;
	}

	export function themr(
		identifier: string,
		defaultTheme?: {},
		options?: IThemrOptions
	): <P, S>(component: new(props?: P, context?: any) => React.Component<P, S>) => ThemedComponentClass<P, S>;
}
