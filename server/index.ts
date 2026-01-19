import { createMcpHandler } from 'agents/mcp';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { WIDGET_CONFIGS } from './widgets/config';
import { registerWidget } from './widgets/registry';

const server = new McpServer({
	name: 'ChatGPT App Template',
	version: '0.0.1',
});

type AssetsEnv = Env & {
	ASSETS: {
		fetch: typeof fetch;
	};
};

let assetsBinding: AssetsEnv['ASSETS'] | null = null;

// Register widgets at module initialization
WIDGET_CONFIGS.forEach((config) => registerWidget(server, config, () => assetsBinding!));

server.registerTool(
	'reservation-card',
	{
		title: 'Show Reservation Card',
		inputSchema: { reservationId: z.string() },
		_meta: {
			'openai/outputTemplate': 'ui://widget/reservation-card.html',
			'openai/toolInvocation/invoking': 'Preparing the reservation card...',
			'openai/toolInvocation/invoked': 'Reservation card ready.',
		},
	},
	async ({ reservationId }) => {
		return {
			content: [
				{
					type: 'text',
					text: `Showing reservation ${reservationId}`,
				},
			],
		};
	},
);

export default {
	fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
		// @ts-ignore McpHandler is too strict with current SDK version
		const handler = createMcpHandler(server);
		const url = new URL(request.url);

		const { ASSETS } = env as AssetsEnv;
		assetsBinding = ASSETS;

		if (url.pathname === '/mcp') {
			return handler(request, env, ctx);
		}

		return ASSETS.fetch(request);
	},
};
