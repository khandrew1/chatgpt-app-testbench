import type { WidgetConfig } from './utils';

export const WIDGET_CONFIGS: WidgetConfig[] = [
	{
		name: 'reservation-card',
		uri: 'ui://widget/reservation-card.html',
		title: 'Reservation Card Widget',
		description: 'Reservation card UI widget for ChatGPT',
		rootElementId: 'reservation-root',
		meta: {
			prefersBorder: true,
		},
	},
	{
		name: 'testbench',
		uri: 'ui://widget/testbench.html',
		title: 'API Testbench Widget',
		description: 'Interactive testbench for window.openai API',
		rootElementId: 'testbench-root',
		meta: {
			prefersBorder: true,
		},
	},
	{
		name: 'modal-echo',
		uri: 'ui://widget/modal-echo.html',
		title: 'Echo Modal Widget',
		description: 'Modal widget for testing the echo tool',
		rootElementId: 'modal-echo-root',
		meta: {
			prefersBorder: true,
		},
	},
	{
		name: 'modal-timestamp',
		uri: 'ui://widget/modal-timestamp.html',
		title: 'Timestamp Modal Widget',
		description: 'Modal widget for testing the get-timestamp tool',
		rootElementId: 'modal-timestamp-root',
		meta: {
			prefersBorder: true,
		},
	},
	{
		name: 'modal-random',
		uri: 'ui://widget/modal-random.html',
		title: 'Random Number Modal Widget',
		description: 'Modal widget for testing the random-number tool',
		rootElementId: 'modal-random-root',
		meta: {
			prefersBorder: true,
		},
	},
	{
		name: 'csp-test',
		uri: 'ui://widget/csp-test.html',
		title: 'CSP Test Widget',
		description: 'Widget for testing Content Security Policy domains',
		rootElementId: 'csp-test-root',
		meta: {
			prefersBorder: true,
			csp: {
				connect_domains: ['https://httpbin.org'],
				resource_domains: ['https://via.placeholder.com', 'https://cdn.openai.com', 'https://fonts.gstatic.com'],
			},
		},
	},
];
