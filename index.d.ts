import * as React from "react";

declare module "react-css-themr"
{
	export interface IThemrOptions
	{
		/** @default "deeply" */
		composeTheme?: "deeply" | "softly" | false,
		/** @default false */
		withRef?: boolean
	}

	export interface ThemeProviderProps
	{
		theme: {}
	}

	export class ThemeProvider extends React.Component<ThemeProviderProps, any>
	{

	}

	interface ThemedComponent<P, S, Base> extends React.Component<P, S> {
		getWrappedInstance(): Base;
	}

	interface ThemedComponentClass<P, S, Base> extends React.ComponentClass<P> {
		new(props?: P, context?: any): ThemedComponent<P, S, Base>;
	}

	export function themr
		(
			identifier: string,
			defaultTheme?: {},
			options?: IThemrOptions
		): <P, S, C extends new(props?: P, context?: any) => React.Component<P, S>>
			(component: C) => ThemedComponentClass<P, S, C>;
}
