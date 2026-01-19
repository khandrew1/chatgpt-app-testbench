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
];
