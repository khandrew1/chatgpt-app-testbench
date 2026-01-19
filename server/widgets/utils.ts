type AssetsBinding = {
	fetch: typeof fetch;
};

export interface WidgetAssets {
	globals: string;
	widgetStyles: string;
	widgetScript: string;
}

export interface WidgetConfig {
	name: string;
	uri: string;
	title: string;
	description: string;
	rootElementId: string;
	meta?: {
		prefersBorder?: boolean;
		domain?: string;
		csp?: {
			connect_domains?: string[];
			resource_domains?: string[];
		};
	};
}

export const loadAssetText = async (path: string, assetsBinding: AssetsBinding): Promise<string> => {
	const url = new URL(path, 'https://assets.local');
	const response = await assetsBinding.fetch(new Request(url.toString()));
	if (!response.ok) {
		throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
	}

	return response.text();
};

export const loadWidgetAssets = async (
	widgetName: string,
	assetsBinding: AssetsBinding,
): Promise<WidgetAssets> => {
	const [globals, widgetStyles, widgetScript] = await Promise.all([
		loadAssetText('/globals.css', assetsBinding),
		loadAssetText(`/${widgetName}.css`, assetsBinding),
		loadAssetText(`/${widgetName}.js`, assetsBinding),
	]);

	return { globals, widgetStyles, widgetScript };
};

export const generateWidgetHTML = (config: WidgetConfig, assets: WidgetAssets): string => {
	return `
<!DOCTYPE html>
<html>
	<head>
		<style>${assets.globals}</style>
		<style>${assets.widgetStyles}</style>
	</head>
	<body>
		<div id="${config.rootElementId}"></div>
		<script type="module">${assets.widgetScript}</script>
	</body>
</html>
	`.trim();
};
