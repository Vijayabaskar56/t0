import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
	error: Error;
	reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
	const isDev = import.meta.env.DEV;

	const createGithubIssue = () => {
		const title = encodeURIComponent(`Error: ${error.message}`);
		const body = encodeURIComponent(`## Error Details

**Message:** ${error.message}

**Stack:**
\`\`\`
${error.stack || "No stack trace available"}
\`\`\`

**Location:** ${window.location.href}

**User Agent:** ${navigator.userAgent}

## Steps to Reproduce
1.
2.
3.

## Expected Behavior


## Actual Behavior

`);
		window.open(
			`https://github.com/Vijayabaskar56/tanstack-start-faster/issues/new?title=${title}&body=${body}`,
			"_blank",
		);
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-2xl rounded-lg border border-red-200 bg-white shadow-lg">
				<div className="border-b border-red-200 bg-red-50 px-6 py-4">
					<div className="flex items-center gap-3">
						<AlertCircle className="h-6 w-6 text-red-600" />
						<h1 className="text-xl font-bold text-red-900">
							Something went wrong
						</h1>
					</div>
				</div>

				<div className="space-y-4 p-6">
					<div>
						<h2 className="mb-2 text-sm font-semibold text-gray-700">
							Error Message
						</h2>
						<div className="rounded-md bg-gray-50 p-4">
							<p className="font-mono text-sm text-red-600">
								{error.message || "Unknown error occurred"}
							</p>
						</div>
					</div>

					{isDev && error.stack && (
						<div>
							<h2 className="mb-2 text-sm font-semibold text-gray-700">
								Stack Trace
							</h2>
							<div className="max-h-64 overflow-auto rounded-md bg-gray-900 p-4">
								<pre className="font-mono text-xs text-gray-100">
									{error.stack}
								</pre>
							</div>
						</div>
					)}

					<div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
						<p className="text-sm text-yellow-800">
							If this error persists after resetting, please report it on GitHub
							to help us improve the application.
						</p>
					</div>

					<div className="flex flex-col gap-3 pt-2 sm:flex-row">
						<button
							type="button"
							onClick={reset}
							className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							<RefreshCw className="h-4 w-4" />
							Reset Application
						</button>

						<button
							type="button"
							onClick={createGithubIssue}
							className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
								<title>github</title>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							Report on GitHub
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
