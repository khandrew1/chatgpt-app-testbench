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

interface RandomResult {
	value: number;
	min: number;
	max: number;
	timestamp: string;
}

function ModalRandomWidget() {
	const [min, setMin] = useState('1');
	const [max, setMax] = useState('100');
	const [result, setResult] = useState<RandomResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleGenerate = async () => {
		setLoading(true);
		setError(null);
		try {
			const response = await window.openai.callTool('random-number', {
				min: Number(min),
				max: Number(max),
			});
			const data = response as { structuredContent?: RandomResult };
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
				<h2 className="heading-lg">Random Number Modal</h2>
				<Badge color="warning">random-number</Badge>
			</div>
			<p className="text-secondary text-sm mb-4">
				Generate a random number within the specified range.
			</p>

			<div className="space-y-4">
				<div className="grid grid-cols-2 gap-3">
					<div>
						<label className="block text-sm font-medium mb-1">Min</label>
						<input
							type="number"
							value={min}
							onChange={(e) => setMin(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-default rounded-lg bg-surface"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">Max</label>
						<input
							type="number"
							value={max}
							onChange={(e) => setMax(e.target.value)}
							className="w-full px-3 py-2 text-sm border border-default rounded-lg bg-surface"
						/>
					</div>
				</div>

				<Button
					variant="solid"
					color="primary"
					block
					onClick={handleGenerate}
					disabled={loading}
				>
					{loading ? 'Generating...' : 'Generate Random Number'}
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
							<Badge color="success">Result</Badge>
						</div>
						<div className="text-center py-4">
							<span className="text-4xl font-bold text-primary">{result.value}</span>
						</div>
						<div className="text-center text-xs text-secondary">
							Range: {result.min} - {result.max}
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

createRoot(document.getElementById('modal-random-root')!).render(<ModalRandomWidget />);
