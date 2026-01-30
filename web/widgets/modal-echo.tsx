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

interface EchoResult {
	echoed: string;
	timestamp: string;
}

function ModalEchoWidget() {
	const [message, setMessage] = useState('Hello from modal!');
	const [result, setResult] = useState<EchoResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleEcho = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await window.openai.callTool('echo', { message });
			const data = response as { structuredContent?: EchoResult };
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
				<h2 className="heading-lg">Echo Modal</h2>
				<Badge color="primary">callTool</Badge>
			</div>
			<p className="text-secondary text-sm mb-4">
				Test the echo tool by sending a message and viewing the response.
			</p>

			<div className="space-y-4">
				<div>
					<label className="block text-sm font-medium mb-1">Message</label>
					<input
						type="text"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="Enter a message to echo"
						className="w-full px-3 py-2 text-sm border border-default rounded-lg bg-surface"
					/>
				</div>

				<Button
					variant="solid"
					color="primary"
					block
					onClick={handleEcho}
					disabled={loading || !message.trim()}
				>
					{loading ? 'Sending...' : 'Call Echo Tool'}
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
						<div className="flex items-center gap-2 mb-2">
							<Badge color="success">Response</Badge>
						</div>
						<div className="space-y-2">
							<div>
								<span className="text-xs text-secondary">Echoed Message:</span>
								<p className="font-mono text-sm">{result.echoed}</p>
							</div>
							<div>
								<span className="text-xs text-secondary">Timestamp:</span>
								<p className="font-mono text-xs">{result.timestamp}</p>
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

createRoot(document.getElementById('modal-echo-root')!).render(<ModalEchoWidget />);
