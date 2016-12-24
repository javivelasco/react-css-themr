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

	interface ThemedComponent<T> extends React.ComponentClass<T>
	{
		getWrappedInstance(): React.Component<T, void>;
	}

	export function themr(
		identifier: string,
		defaultTheme?: {},
		options?: IThemrOptions
	): <T extends {}>(component: React.ComponentClass<T>) => ThemedComponent<T>;
}
