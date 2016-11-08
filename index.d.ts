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

	export function themr(
		identifier: string,
		defaultTheme?: {},
		options?: IThemrOptions
	);
}
