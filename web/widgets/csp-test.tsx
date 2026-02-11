import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';

declare global {
	interface Window {
		openai?: {
			theme?: 'light' | 'dark';
		};
	}
}

interface TestResult {
	domain: string;
	type: 'connect' | 'resource' | 'frame';
	status: 'pending' | 'success' | 'error';
	message?: string;
	imageUrl?: string;
}

const CSP_CONFIG = {
	connect_domains: ['https://httpbin.org'],
	resource_domains: ['https://placehold.co'],
	frame_domains: ['https://example.com'],
};

function useTheme() {
	const [theme, setTheme] = useState<'light' | 'dark'>('light');

	useEffect(() => {
		const handleSetGlobal = (event: CustomEvent<{ globals: { theme?: 'light' | 'dark' } }>) => {
			const newTheme = event.detail.globals.theme;
			if (newTheme) {
				setTheme(newTheme);
			}
		};
		window.addEventListener('openai:set_globals', handleSetGlobal as EventListener, {
			passive: true,
		});
		if (window.openai?.theme) {
			setTheme(window.openai.theme);
		}
		return () => {
			window.removeEventListener('openai:set_globals', handleSetGlobal as EventListener);
		};
	}, []);

	return theme;
}

function CspTestWidget() {
	const [results, setResults] = useState<TestResult[]>([]);
	const [isTesting, setIsTesting] = useState(false);
	const theme = useTheme();

	const runTests = async () => {
		setIsTesting(true);
		setResults([]);

		// Test connect domains
		for (const domain of CSP_CONFIG.connect_domains) {
			setResults((prev) => [
				...prev,
				{ domain, type: 'connect', status: 'pending' },
			]);

			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000);

				const response = await fetch(`${domain}/get`, {
					method: 'GET',
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				setResults((prev) =>
					prev.map((r) =>
						r.domain === domain && r.type === 'connect'
							? {
									...r,
									status: 'success',
									message: `HTTP ${response.status}`,
								}
							: r,
					),
				);
			} catch (error) {
				setResults((prev) =>
					prev.map((r) =>
						r.domain === domain && r.type === 'connect'
							? {
									...r,
									status: 'error',
									message: error instanceof Error ? error.message : 'Failed',
								}
							: r,
					),
				);
			}
		}

		// Test resource domains
		for (const domain of CSP_CONFIG.resource_domains) {
			setResults((prev) => [
				...prev,
				{ domain, type: 'resource', status: 'pending' },
			]);

			try {
				const imageUrl = `${domain}/150`;
				await new Promise<void>((resolve, reject) => {
					const img = new Image();
					const timeoutId = setTimeout(() => {
						reject(new Error('Timeout'));
					}, 5000);

					img.onload = () => {
						clearTimeout(timeoutId);
						resolve();
					};
					img.onerror = () => {
						clearTimeout(timeoutId);
						reject(new Error('Failed to load'));
					};
					img.src = imageUrl;
				});

				setResults((prev) =>
					prev.map((r) =>
						r.domain === domain && r.type === 'resource'
							? {
									...r,
									status: 'success',
									message: 'Image loaded',
									imageUrl,
								}
							: r,
					),
				);
			} catch (error) {
				setResults((prev) =>
					prev.map((r) =>
						r.domain === domain && r.type === 'resource'
							? {
									...r,
									status: 'error',
									message: error instanceof Error ? error.message : 'Failed',
								}
							: r,
					),
				);
			}
		}

		// Test frame domains
		for (const domain of CSP_CONFIG.frame_domains) {
			setResults((prev) => [
				...prev,
				{ domain, type: 'frame', status: 'pending' },
			]);

			try {
				await new Promise<void>((resolve, reject) => {
					const iframe = document.createElement('iframe');
					iframe.style.display = 'none';
					const timeoutId = setTimeout(() => {
						document.body.removeChild(iframe);
						reject(new Error('Timeout'));
					}, 5000);

					iframe.onload = () => {
						clearTimeout(timeoutId);
						document.body.removeChild(iframe);
						resolve();
					};
					iframe.onerror = () => {
						clearTimeout(timeoutId);
						document.body.removeChild(iframe);
						reject(new Error('Failed to load'));
					};
					iframe.src = domain;
					document.body.appendChild(iframe);
				});

				setResults((prev) =>
					prev.map((r) =>
						r.domain === domain && r.type === 'frame'
							? {
									...r,
									status: 'success',
									message: 'Frame loaded',
								}
							: r,
					),
				);
			} catch (error) {
				setResults((prev) =>
					prev.map((r) =>
						r.domain === domain && r.type === 'frame'
							? {
									...r,
									status: 'error',
									message: error instanceof Error ? error.message : 'Failed',
								}
							: r,
					),
				);
			}
		}

		setIsTesting(false);
	};

	return (
		<div
			className={`w-full max-w-md rounded-2xl border border-default bg-surface shadow-lg ${theme === 'dark' ? 'dark' : ''}`}
		>
			<div className="p-4 border-b border-subtle">
				<h2 className="heading-lg">CSP Test</h2>
				<p className="text-secondary text-sm mt-1">
					Test Content Security Policy domains
				</p>
			</div>

			<div className="p-4 border-b border-subtle">
				<h3 className="text-sm font-semibold mb-3">Configured Domains</h3>
				<div className="space-y-2">
					<div>
						<span className="text-xs text-secondary">Connect Domains:</span>
						<div className="flex flex-wrap gap-1 mt-1">
							{CSP_CONFIG.connect_domains.map((domain) => (
								<Badge key={domain} color="secondary" size="sm">
									{domain}
								</Badge>
							))}
						</div>
					</div>
					<div>
						<span className="text-xs text-secondary">Resource Domains:</span>
						<div className="flex flex-wrap gap-1 mt-1">
							{CSP_CONFIG.resource_domains.map((domain) => (
								<Badge key={domain} color="secondary" size="sm">
									{domain}
								</Badge>
							))}
						</div>
					</div>
					<div>
						<span className="text-xs text-secondary">Frame Domains:</span>
						<div className="flex flex-wrap gap-1 mt-1">
							{CSP_CONFIG.frame_domains.map((domain) => (
								<Badge key={domain} color="secondary" size="sm">
									{domain}
								</Badge>
							))}
						</div>
					</div>
				</div>
			</div>

			<div className="p-4 border-b border-subtle">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-sm font-semibold">Test Results</h3>
					<Button
						variant="soft"
						color="primary"
						size="sm"
						onClick={runTests}
						disabled={isTesting}
					>
						{isTesting ? 'Testing...' : 'Run Tests'}
					</Button>
				</div>

				{results.length === 0 ? (
					<p className="text-secondary text-sm">
						No tests run yet. Click "Run Tests" to verify CSP domains.
					</p>
				) : (
					<div className="space-y-2">
						{results.map((result) => (
							<div
								key={`${result.type}-${result.domain}`}
								className="flex items-center justify-between p-2 bg-surface-secondary rounded-lg"
							>
								<div className="flex items-center gap-2">
									<Badge
										color={
											result.status === 'success'
												? 'success'
												: result.status === 'error'
													? 'danger'
													: 'secondary'
										}
										size="sm"
									>
										{result.type}
									</Badge>
									<span className="text-sm font-mono">{result.domain}</span>
								</div>
								<div className="flex items-center gap-2">
									{result.message && (
										<span className="text-xs text-secondary">{result.message}</span>
									)}
									{result.imageUrl && result.status === 'success' && (
										<img
											src={result.imageUrl}
											alt="CSP test"
											className="w-8 h-8 rounded object-cover"
										/>
									)}
									{result.status === 'pending' && (
										<div className="w-4 h-4 border-2 border-secondary border-t-transparent rounded-full animate-spin" />
									)}
									{result.status === 'success' && (
										<span className="text-success text-lg">✓</span>
									)}
									{result.status === 'error' && (
										<span className="text-danger text-lg">✗</span>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="p-4">
				<p className="text-xs text-secondary">
					Note: CSP errors will appear as failed tests. Check browser console for
					detailed error messages.
				</p>
			</div>
		</div>
	);
}

createRoot(document.getElementById('csp-test-root')!).render(<CspTestWidget />);
