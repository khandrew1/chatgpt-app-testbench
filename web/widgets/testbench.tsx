import { createRoot } from 'react-dom/client';
import { useState, useSyncExternalStore } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';

// Type definitions for window.openai
interface OpenAiGlobals {
	theme: 'light' | 'dark';
	locale: string;
	displayMode: 'pip' | 'inline' | 'fullscreen';
	maxHeight: number;
	userAgent: {
		device: string;
		capabilities?: string[];
	};
	safeArea: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};
	toolInput: unknown;
	toolOutput: unknown;
	toolResponseMetadata: unknown;
	widgetState: unknown;
}

declare global {
	interface Window {
		openai: OpenAiGlobals & {
			callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
			sendFollowUpMessage: (opts: { prompt: string }) => Promise<void>;
			openExternal: (opts: { href: string }) => Promise<void>;
			requestDisplayMode: (opts: { mode: 'pip' | 'inline' | 'fullscreen' }) => Promise<void>;
			requestClose: () => Promise<void>;
			setWidgetState: (state: unknown) => void;
			uploadFile: (file: File) => Promise<string>;
			getFileDownloadUrl: (opts: { fileId: string }) => Promise<string>;
			notifyIntrinsicHeight: (height: number) => Promise<void>;
			setOpenInAppUrl: (opts: { href: string }) => void;
		};
	}
}

type SetGlobalsEvent = CustomEvent<{ globals: Record<string, unknown> }>;
const SET_GLOBALS_EVENT_TYPE = 'openai:set_globals';

function useOpenAiGlobal<K extends keyof OpenAiGlobals>(key: K): OpenAiGlobals[K] | undefined {
	return useSyncExternalStore(
		(onChange) => {
			const handleSetGlobal = (event: SetGlobalsEvent) => {
				const value = event.detail.globals[key];
				if (value === undefined) {
					return;
				}
				onChange();
			};
			window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener, {
				passive: true,
			});
			return () => {
				window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal as EventListener);
			};
		},
		() => window.openai?.[key]
	);
}

interface ApiResult {
	method: string;
	success: boolean;
	data?: unknown;
	error?: string;
	timestamp: Date;
}

function PropertiesSection() {
	const theme = useOpenAiGlobal('theme');
	const locale = useOpenAiGlobal('locale');
	const displayMode = useOpenAiGlobal('displayMode');
	const maxHeight = useOpenAiGlobal('maxHeight');
	const userAgent = useOpenAiGlobal('userAgent');
	const safeArea = useOpenAiGlobal('safeArea');
	const toolInput = useOpenAiGlobal('toolInput');
	const toolOutput = useOpenAiGlobal('toolOutput');
	const toolResponseMetadata = useOpenAiGlobal('toolResponseMetadata');
	const widgetState = useOpenAiGlobal('widgetState');

	return (
		<div className="border-b border-subtle p-4">
			<h3 className="text-sm font-semibold mb-3">Properties (Read-only)</h3>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-secondary">theme</span>
					<Badge color={theme === 'dark' ? 'secondary' : 'primary'}>{theme ?? 'N/A'}</Badge>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-secondary">locale</span>
					<span className="font-mono text-xs">{locale ?? 'N/A'}</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-secondary">displayMode</span>
					<Badge color="secondary">{displayMode ?? 'N/A'}</Badge>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-secondary">maxHeight</span>
					<span className="font-mono text-xs">{maxHeight != null ? `${maxHeight}px` : 'N/A'}</span>
				</div>
				<div className="col-span-2">
					<span className="text-secondary">userAgent</span>
					<pre className="mt-1 p-2 bg-surface-tertiary rounded text-xs overflow-x-auto">
						{userAgent ? JSON.stringify(userAgent, null, 2) : 'N/A'}
					</pre>
				</div>
				<div className="col-span-2">
					<span className="text-secondary">safeArea</span>
					<pre className="mt-1 p-2 bg-surface-tertiary rounded text-xs overflow-x-auto">
						{safeArea ? JSON.stringify(safeArea, null, 2) : 'N/A'}
					</pre>
				</div>
				<div className="col-span-2">
					<span className="text-secondary">toolInput</span>
					<pre className="mt-1 p-2 bg-surface-tertiary rounded text-xs overflow-x-auto max-h-24 overflow-y-auto">
						{toolInput ? JSON.stringify(toolInput, null, 2) : 'N/A'}
					</pre>
				</div>
				<div className="col-span-2">
					<span className="text-secondary">toolOutput</span>
					<pre className="mt-1 p-2 bg-surface-tertiary rounded text-xs overflow-x-auto max-h-24 overflow-y-auto">
						{toolOutput ? JSON.stringify(toolOutput, null, 2) : 'N/A'}
					</pre>
				</div>
				<div className="col-span-2">
					<span className="text-secondary">toolResponseMetadata</span>
					<pre className="mt-1 p-2 bg-surface-tertiary rounded text-xs overflow-x-auto max-h-24 overflow-y-auto">
						{toolResponseMetadata ? JSON.stringify(toolResponseMetadata, null, 2) : 'N/A'}
					</pre>
				</div>
				<div className="col-span-2">
					<span className="text-secondary">widgetState</span>
					<pre className="mt-1 p-2 bg-surface-tertiary rounded text-xs overflow-x-auto max-h-24 overflow-y-auto">
						{widgetState ? JSON.stringify(widgetState, null, 2) : 'N/A'}
					</pre>
				</div>
			</div>
		</div>
	);
}

function MethodsSection({ onResult }: { onResult: (result: ApiResult) => void }) {
	const [toolName, setToolName] = useState('echo');
	const [toolArgs, setToolArgs] = useState('{"message": "Hello from testbench!"}');
	const [followUpPrompt, setFollowUpPrompt] = useState('This is a follow-up message from the widget.');
	const [externalUrl, setExternalUrl] = useState('https://example.com');
	const [widgetStateJson, setWidgetStateJson] = useState('{"counter": 1}');
	const [fileId, setFileId] = useState('');
	const [intrinsicHeight, setIntrinsicHeight] = useState('400');
	const [openInAppUrl, setOpenInAppUrl] = useState('https://example.com/app');

	const handleApiCall = async (method: string, fn: () => Promise<unknown>) => {
		try {
			const data = await fn();
			onResult({ method, success: true, data, timestamp: new Date() });
		} catch (err) {
			onResult({
				method,
				success: false,
				error: err instanceof Error ? err.message : String(err),
				timestamp: new Date(),
			});
		}
	};

	return (
		<div className="border-b border-subtle p-4">
			<h3 className="text-sm font-semibold mb-3">Methods (Interactive)</h3>
			<div className="space-y-4">
				{/* callTool */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">callTool(name, args)</div>
					<div className="space-y-2">
						<input
							type="text"
							value={toolName}
							onChange={(e) => setToolName(e.target.value)}
							placeholder="Tool name"
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface"
						/>
						<textarea
							value={toolArgs}
							onChange={(e) => setToolArgs(e.target.value)}
							placeholder="Arguments (JSON)"
							rows={2}
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface font-mono"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() =>
								handleApiCall('callTool', () =>
									window.openai.callTool(toolName, JSON.parse(toolArgs))
								)
							}
						>
							Call Tool
						</Button>
					</div>
				</div>

				{/* sendFollowUpMessage */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">sendFollowUpMessage(&#123; prompt &#125;)</div>
					<div className="space-y-2">
						<input
							type="text"
							value={followUpPrompt}
							onChange={(e) => setFollowUpPrompt(e.target.value)}
							placeholder="Prompt text"
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() =>
								handleApiCall('sendFollowUpMessage', () =>
									window.openai.sendFollowUpMessage({ prompt: followUpPrompt })
								)
							}
						>
							Send Follow-Up
						</Button>
					</div>
				</div>

				{/* openExternal */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">openExternal(&#123; href &#125;)</div>
					<div className="space-y-2">
						<input
							type="text"
							value={externalUrl}
							onChange={(e) => setExternalUrl(e.target.value)}
							placeholder="URL"
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() =>
								handleApiCall('openExternal', () =>
									window.openai.openExternal({ href: externalUrl })
								)
							}
						>
							Open External
						</Button>
					</div>
				</div>

				{/* requestDisplayMode */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">requestDisplayMode(&#123; mode &#125;)</div>
					<div className="flex gap-2">
						<Button
							variant="soft"
							color="secondary"
							onClick={() =>
								handleApiCall('requestDisplayMode', () =>
									window.openai.requestDisplayMode({ mode: 'pip' })
								)
							}
						>
							PiP
						</Button>
						<Button
							variant="soft"
							color="secondary"
							onClick={() =>
								handleApiCall('requestDisplayMode', () =>
									window.openai.requestDisplayMode({ mode: 'inline' })
								)
							}
						>
							Inline
						</Button>
						<Button
							variant="soft"
							color="secondary"
							onClick={() =>
								handleApiCall('requestDisplayMode', () =>
									window.openai.requestDisplayMode({ mode: 'fullscreen' })
								)
							}
						>
							Fullscreen
						</Button>
					</div>
				</div>

				{/* requestClose */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">requestClose()</div>
					<Button
						variant="soft"
						color="danger"
						block
						onClick={() => handleApiCall('requestClose', () => window.openai.requestClose())}
					>
						Close Widget
					</Button>
				</div>

				{/* setWidgetState */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">setWidgetState(state)</div>
					<div className="space-y-2">
						<textarea
							value={widgetStateJson}
							onChange={(e) => setWidgetStateJson(e.target.value)}
							placeholder="State (JSON)"
							rows={2}
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface font-mono"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() => {
								try {
									window.openai.setWidgetState(JSON.parse(widgetStateJson));
									onResult({
										method: 'setWidgetState',
										success: true,
										data: 'State updated',
										timestamp: new Date(),
									});
								} catch (err) {
									onResult({
										method: 'setWidgetState',
										success: false,
										error: err instanceof Error ? err.message : String(err),
										timestamp: new Date(),
									});
								}
							}}
						>
							Set Widget State
						</Button>
					</div>
				</div>

				{/* uploadFile */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">uploadFile(file)</div>
					<div className="space-y-2">
						<input
							type="file"
							accept="image/png,image/jpeg,image/webp"
							onChange={(e) => {
								const file = e.target.files?.[0];
								if (file) {
									handleApiCall('uploadFile', async () => {
										const result = await window.openai.uploadFile(file);
										setFileId(result);
										return result;
									});
								}
							}}
							className="w-full text-sm"
						/>
					</div>
				</div>

				{/* getFileDownloadUrl */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">getFileDownloadUrl(&#123; fileId &#125;)</div>
					<div className="space-y-2">
						<input
							type="text"
							value={fileId}
							onChange={(e) => setFileId(e.target.value)}
							placeholder="File ID"
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface font-mono"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() =>
								handleApiCall('getFileDownloadUrl', () =>
									window.openai.getFileDownloadUrl({ fileId })
								)
							}
						>
							Get Download URL
						</Button>
					</div>
				</div>

				{/* notifyIntrinsicHeight */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">notifyIntrinsicHeight(height)</div>
					<div className="space-y-2">
						<input
							type="number"
							value={intrinsicHeight}
							onChange={(e) => setIntrinsicHeight(e.target.value)}
							placeholder="Height in pixels"
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() =>
								handleApiCall('notifyIntrinsicHeight', () =>
									window.openai.notifyIntrinsicHeight(Number(intrinsicHeight))
								)
							}
						>
							Notify Height
						</Button>
					</div>
				</div>

				{/* setOpenInAppUrl */}
				<div className="p-3 bg-surface-secondary rounded-lg">
					<div className="text-xs font-medium mb-2">setOpenInAppUrl(&#123; href &#125;)</div>
					<div className="space-y-2">
						<input
							type="text"
							value={openInAppUrl}
							onChange={(e) => setOpenInAppUrl(e.target.value)}
							placeholder="URL"
							className="w-full px-2 py-1 text-sm border border-default rounded bg-surface"
						/>
						<Button
							variant="soft"
							color="primary"
							block
							onClick={() => {
								try {
									window.openai.setOpenInAppUrl({ href: openInAppUrl });
									onResult({
										method: 'setOpenInAppUrl',
										success: true,
										data: 'URL set',
										timestamp: new Date(),
									});
								} catch (err) {
									onResult({
										method: 'setOpenInAppUrl',
										success: false,
										error: err instanceof Error ? err.message : String(err),
										timestamp: new Date(),
									});
								}
							}}
						>
							Set Open-in-App URL
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}

function ResultsPanel({ result }: { result: ApiResult | null }) {
	if (!result) {
		return (
			<div className="p-4">
				<h3 className="text-sm font-semibold mb-2">Results</h3>
				<p className="text-secondary text-sm">No API calls yet. Try one of the methods above.</p>
			</div>
		);
	}

	return (
		<div className="p-4">
			<h3 className="text-sm font-semibold mb-2">Results</h3>
			<div className="p-3 bg-surface-secondary rounded-lg">
				<div className="flex items-center justify-between mb-2">
					<span className="font-mono text-sm">{result.method}</span>
					<Badge color={result.success ? 'success' : 'danger'}>
						{result.success ? 'Success' : 'Error'}
					</Badge>
				</div>
				<pre className="p-2 bg-surface-tertiary rounded text-xs overflow-x-auto max-h-32 overflow-y-auto">
					{result.success
						? JSON.stringify(result.data, null, 2) ?? 'void'
						: result.error}
				</pre>
				<p className="text-xs text-secondary mt-2">
					{result.timestamp.toLocaleTimeString()}
				</p>
			</div>
		</div>
	);
}

export function TestbenchWidget() {
	const [result, setResult] = useState<ApiResult | null>(null);

	return (
		<div className="w-full max-w-2xl rounded-2xl border border-default bg-surface shadow-lg">
			<div className="p-4 border-b border-subtle">
				<h2 className="heading-lg">API Testbench</h2>
				<p className="text-secondary text-sm mt-1">
					Interactive testbench for the window.openai API
				</p>
			</div>
			<PropertiesSection />
			<MethodsSection onResult={setResult} />
			<ResultsPanel result={result} />
		</div>
	);
}

createRoot(document.getElementById('testbench-root')!).render(<TestbenchWidget />);
