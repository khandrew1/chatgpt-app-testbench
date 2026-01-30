import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';

declare global {
	interface Window {
		openai: {
			callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
			requestClose: () => Promise<void>;
		};
	}
}

interface TimestampResult {
	iso: string;
	unix: number;
	utc: string;
	local: string;
	timezone: string;
}

function ModalTimestampWidget() {
	const [result, setResult] = useState<TimestampResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGetTimestamp = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await window.openai.callTool('get-timestamp', {});
			const data = response as { structuredContent?: TimestampResult };
			if (data.structuredContent) {
				setResult(data.structuredContent);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-6 bg-surface rounded-2xl border border-default max-w-xl mx-auto">
			<div className="flex items-center justify-between mb-4">
				<h2 className="heading-lg">Timestamp Modal</h2>
				<Badge color="secondary">get-timestamp</Badge>
			</div>
			<p className="text-secondary text-sm mb-4">
				Get the current server timestamp in multiple formats.
			</p>

			<div className="space-y-4">
				<Button
					variant="solid"
					color="primary"
					block
					onClick={handleGetTimestamp}
					disabled={loading}
				>
					{loading ? 'Fetching...' : 'Get Current Timestamp'}
				</Button>

				{error && (
					<div className="p-3 bg-surface-tertiary rounded-lg border border-danger">
						<div className="flex items-center gap-2 mb-1">
							<Badge color="danger">Error</Badge>
						</div>
						<p className="text-sm text-danger">{error}</p>
					</div>
				)}

				{result && (
					<div className="p-3 bg-surface-secondary rounded-lg">
						<div className="flex items-center gap-2 mb-3">
							<Badge color="success">Timestamp Data</Badge>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between items-center">
								<span className="text-xs text-secondary">ISO 8601:</span>
								<span className="font-mono text-xs">{result.iso}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-xs text-secondary">Unix (ms):</span>
								<span className="font-mono text-xs">{result.unix}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-xs text-secondary">UTC:</span>
								<span className="font-mono text-xs">{result.utc}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-xs text-secondary">Timezone:</span>
								<span className="font-mono text-xs">{result.timezone}</span>
							</div>
						</div>
					</div>
				)}

				<Button
					variant="ghost"
					color="secondary"
					block
					onClick={() => window.openai.requestClose()}
				>
					Close Modal
				</Button>
			</div>
		</div>
	);
}

createRoot(document.getElementById('modal-timestamp-root')!).render(<ModalTimestampWidget />);
