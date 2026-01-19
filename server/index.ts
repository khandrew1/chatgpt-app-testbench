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

server.registerTool(
	'show-testbench',
	{
		title: 'Show API Testbench',
		inputSchema: {},
		_meta: {
			'openai/outputTemplate': 'ui://widget/testbench.html',
			'openai/toolInvocation/invoking': 'Opening API testbench...',
			'openai/toolInvocation/invoked': 'API testbench ready.',
		},
	},
	async () => {
		return {
			content: [
				{
					type: 'text',
					text: 'Showing API testbench widget',
				},
			],
		};
	},
);

server.registerTool(
	'echo',
	{
		title: 'Echo Tool',
		description: 'Demo tool that echoes back the input message. Used for testing callTool from widgets.',
		inputSchema: { message: z.string().describe('Message to echo back') },
		_meta: {
			'openai/componentInitiated': true,
		},
	},
	async ({ message }) => {
		return {
			content: [
				{
					type: 'text',
					text: `Echo: ${message}`,
				},
			],
			structuredContent: {
				echoed: message,
				timestamp: new Date().toISOString(),
			},
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
