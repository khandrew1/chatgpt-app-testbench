import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { generateWidgetHTML, loadWidgetAssets, type WidgetConfig } from './utils';

type AssetsBinding = {
	fetch: typeof fetch;
};

export const registerWidget = (
	server: McpServer,
	config: WidgetConfig,
	getAssetsBinding: () => AssetsBinding,
) => {
	server.registerResource(
		`${config.name}-widget`,
		config.uri,
		{
			title: config.title,
			description: config.description,
			mimeType: 'text/html+skybridge',
		},
		async () => {
			const assets = await loadWidgetAssets(config.name, getAssetsBinding());
			const html = generateWidgetHTML(config, assets);

			return {
				contents: [
					{
						uri: config.uri,
						mimeType: 'text/html+skybridge',
						text: html,
						_meta: {
							'openai/widgetPrefersBorder': config.meta?.prefersBorder,
							'openai/widgetDomain': config.meta?.domain,
							'openai/widgetCSP': config.meta?.csp,
						},
					},
				],
			};
		},
	);
};
