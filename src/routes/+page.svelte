<script>
	import { chunkByCharacters, chunkBySentences, chunkByParagraphs, chunkSemantic } from '$lib/chunkers';
	import { calculateMetrics, calculateIoU } from '$lib/metrics';
	import { defaultText, constructionSpec, drawingNote } from '$lib/sampleText';

	import '../app.css';

	let text = defaultText;
	let strategy = 'characters';
	let chunkSize = 200;
	let overlap = 0;
	let showComparison = false;
	let strategy2 = 'sentences';

	const strategyLabels = {
		characters: 'Fixed Characters',
		sentences: 'Sentence-based',
		paragraphs: 'Paragraph-based',
		semantic: 'Semantic (mock)'
	};

	const strategyDescriptions = {
		characters: 'Splits at a fixed character count, regardless of word or sentence boundaries. Configurable overlap prevents context loss at chunk edges.',
		sentences: 'Accumulates sentences until the size limit is reached, preserving sentence integrity. Uses lookbehind regex on punctuation boundaries.',
		paragraphs: 'Splits on blank lines first; falls back to sentence chunking for oversized paragraphs. Best for structured documents.',
		semantic: 'Mock implementation using paragraph boundaries as a proxy for semantic boundaries. Production use would apply embedding cosine similarity (ClusterSemanticChunker).'
	};

	function getChunks(t, strat, size, olap) {
		switch (strat) {
			case 'characters': return chunkByCharacters(t, size, olap);
			case 'sentences': return chunkBySentences(t, size);
			case 'paragraphs': return chunkByParagraphs(t, size);
			case 'semantic': return chunkSemantic(t, size);
			default: return [];
		}
	}

	$: chunks = getChunks(text, strategy, chunkSize, overlap);
	$: chunks2 = showComparison ? getChunks(text, strategy2, chunkSize, 0) : [];
	$: metrics = calculateMetrics(chunks);
	$: metrics2 = showComparison ? calculateMetrics(chunks2) : null;
	$: efficiency = calculateIoU(chunks);
	$: efficiency2 = showComparison ? calculateIoU(chunks2) : null;

	function getChunkColor(index, total) {
		const hue = (index * 360) / Math.max(total, 1);
		return `hsl(${hue}, 65%, 88%)`;
	}

	function getBorderColor(index, total) {
		const hue = (index * 360) / Math.max(total, 1);
		return `hsl(${hue}, 55%, 55%)`;
	}

	function loadSample(sample) {
		text = sample === 'spec' ? constructionSpec : drawingNote;
	}
</script>

<div class="h-screen flex flex-col bg-slate-50 overflow-hidden">

	<!-- Header -->
	<header class="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-lg font-bold text-slate-900 tracking-tight">Chunking Strategy Visualizer</h1>
				<p class="text-xs text-slate-500 mt-0.5">
					Inspired by
					<a
						href="https://research.trychroma.com/evaluating-chunking"
						class="text-blue-600 hover:text-blue-700 hover:underline font-medium"
						target="_blank"
						rel="noopener noreferrer"
					>
						Brandon Smith's ChromaDB Chunking Evaluation Research
					</a>
				</p>
			</div>
			<div class="text-right text-xs text-slate-400 leading-relaxed hidden sm:block">
				<div>SvelteKit + Tailwind CSS</div>
				<div>Construction document RAG demo</div>
			</div>
		</div>
	</header>

	<!-- Body: sidebar + main -->
	<div class="flex flex-1 overflow-hidden">

		<!-- Left Sidebar: Controls + Metrics -->
		<aside class="w-72 xl:w-80 flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto flex flex-col">
			<div class="p-5 flex-1 space-y-5">

				<!-- Strategy -->
				<div>
					<label for="strategy" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
						Chunking Strategy
					</label>
					<select
						id="strategy"
						bind:value={strategy}
						class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					>
						{#each Object.entries(strategyLabels) as [value, label]}
							<option {value}>{label}</option>
						{/each}
					</select>
					<p class="text-xs text-slate-400 mt-1.5 leading-relaxed">{strategyDescriptions[strategy]}</p>
				</div>

				<!-- Chunk Size -->
				<div>
					<label for="chunkSize" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
						Max Chunk Size
						<span class="text-blue-600 font-bold ml-1">{chunkSize} chars</span>
					</label>
					<input
						id="chunkSize"
						type="range"
						bind:value={chunkSize}
						min="100"
						max="800"
						step="50"
						class="w-full accent-blue-600"
					/>
					<div class="flex justify-between text-xs text-slate-400 mt-0.5">
						<span>100</span><span>800</span>
					</div>
				</div>

				<!-- Overlap -->
				<div>
					<label for="overlap" class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
						Overlap
						{#if strategy === 'characters'}
							<span class="text-orange-500 font-bold ml-1">{overlap} chars</span>
						{:else}
							<span class="text-slate-400 font-normal ml-1">(characters only)</span>
						{/if}
					</label>
					<input
						id="overlap"
						type="range"
						bind:value={overlap}
						min="0"
						max={Math.floor(chunkSize / 2)}
						step="25"
						disabled={strategy !== 'characters'}
						class="w-full accent-orange-500 disabled:opacity-30"
					/>
					<div class="flex justify-between text-xs text-slate-400 mt-0.5">
						<span>0</span><span>{Math.floor(chunkSize / 2)}</span>
					</div>
				</div>

				<!-- Compare -->
				<div>
					<p class="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Compare Strategies</p>
					<label class="flex items-center gap-2 cursor-pointer mb-2">
						<input type="checkbox" bind:checked={showComparison} class="w-4 h-4 accent-blue-600" />
						<span class="text-sm text-slate-700">Side-by-side comparison</span>
					</label>
					{#if showComparison}
						<select
							bind:value={strategy2}
							class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							{#each Object.entries(strategyLabels) as [value, label]}
								<option {value}>{label}</option>
							{/each}
						</select>
					{/if}
				</div>

				<!-- Sample loaders -->
				<div class="pt-4 border-t border-slate-100">
					<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Load Sample</p>
					<div class="flex flex-col gap-2">
						<button
							on:click={() => loadSample('spec')}
							class="w-full px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
						>
							Construction Specification
						</button>
						<button
							on:click={() => loadSample('notes')}
							class="w-full px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-left"
						>
							Drawing General Notes
						</button>
						<button
							on:click={() => (text = '')}
							class="w-full px-3 py-2 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors text-left"
						>
							Clear text
						</button>
					</div>
				</div>

				<!-- Metrics -->
				<div class="pt-4 border-t border-slate-100">
					<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
						Metrics — {strategyLabels[strategy]}
					</p>
					<div class="grid grid-cols-2 gap-2">
						{#each [
							{ label: 'Chunks', value: metrics.count, color: 'text-blue-600' },
							{ label: 'Efficiency', value: efficiency + '%', color: efficiency >= 90 ? 'text-emerald-600' : efficiency >= 70 ? 'text-amber-600' : 'text-red-500' },
							{ label: 'Avg Size', value: metrics.avgSize + ' ch', color: 'text-slate-700' },
							{ label: 'Total', value: metrics.totalChars.toLocaleString(), color: 'text-slate-700' },
							{ label: 'Min', value: metrics.minSize + ' ch', color: 'text-slate-700' },
							{ label: 'Max', value: metrics.maxSize + ' ch', color: 'text-slate-700' }
						] as stat}
							<div class="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
								<div class="text-xs text-slate-400 font-medium">{stat.label}</div>
								<div class="text-base font-bold {stat.color}">{stat.value}</div>
							</div>
						{/each}
					</div>

					{#if showComparison && metrics2}
						<p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 mt-4">
							Metrics — {strategyLabels[strategy2]}
						</p>
						<div class="grid grid-cols-2 gap-2">
							{#each [
								{ label: 'Chunks', value: metrics2.count, color: 'text-purple-600' },
								{ label: 'Efficiency', value: efficiency2 + '%', color: efficiency2 >= 90 ? 'text-emerald-600' : efficiency2 >= 70 ? 'text-amber-600' : 'text-red-500' },
								{ label: 'Avg Size', value: metrics2.avgSize + ' ch', color: 'text-slate-700' },
								{ label: 'Total', value: metrics2.totalChars.toLocaleString(), color: 'text-slate-700' },
								{ label: 'Min', value: metrics2.minSize + ' ch', color: 'text-slate-700' },
								{ label: 'Max', value: metrics2.maxSize + ' ch', color: 'text-slate-700' }
							] as stat}
								<div class="bg-slate-50 rounded-lg border border-slate-200 px-3 py-2">
									<div class="text-xs text-slate-400 font-medium">{stat.label}</div>
									<div class="text-base font-bold {stat.color}">{stat.value}</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Footer credit -->
			<div class="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
				Based on
				<a href="https://research.trychroma.com/evaluating-chunking" class="hover:underline" target="_blank" rel="noopener noreferrer">
					Brandon Smith (ChromaDB)
				</a>
			</div>
		</aside>

		<!-- Right Panel: Text Input + Chunk Visualization -->
		<main class="flex-1 overflow-hidden flex flex-col">

			<!-- Text input bar (pinned to top of right panel) -->
			<div class="px-5 pt-4 pb-3 border-b border-slate-200 bg-white flex-shrink-0">
				<textarea
					bind:value={text}
					class="w-full h-28 p-3 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
					placeholder="Paste your text here, or load a sample from the left panel…"
				/>
			</div>

			<!-- Chunk visualization (scrollable) -->
			<div class="flex-1 overflow-y-auto">
				<div class="grid {showComparison ? 'grid-cols-2' : 'grid-cols-1'} gap-0 h-full divide-x divide-slate-200">

					<!-- Primary chunks -->
					<div class="overflow-y-auto">
						<div class="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
							<span class="text-sm font-semibold text-slate-700">{strategyLabels[strategy]}</span>
							<span class="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 font-medium">
								{chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
							</span>
						</div>
						<div class="p-4 space-y-2">
							{#if chunks.length === 0}
								<div class="text-center text-slate-400 py-12 text-sm">No text to chunk.</div>
							{:else}
								{#each chunks as chunk, i}
									<div
										class="rounded-lg border-l-4 px-4 py-3 relative"
										style="background-color: {getChunkColor(i, chunks.length)}; border-left-color: {getBorderColor(i, chunks.length)}"
									>
										<div class="absolute top-2 right-3 flex items-center gap-2">
											<span class="text-xs font-mono text-slate-500">{chunk.text.length} ch</span>
											<span class="text-xs font-bold text-slate-600 bg-white/60 rounded px-1.5 py-0.5">#{i + 1}</span>
										</div>
										<p class="text-xs font-mono text-slate-800 pr-20 leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
									</div>
								{/each}
							{/if}
						</div>
					</div>

					<!-- Comparison chunks -->
					{#if showComparison}
						<div class="overflow-y-auto">
							<div class="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10 flex items-center justify-between">
								<span class="text-sm font-semibold text-slate-700">{strategyLabels[strategy2]}</span>
								<span class="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2.5 py-0.5 font-medium">
									{chunks2.length} chunk{chunks2.length !== 1 ? 's' : ''}
								</span>
							</div>
							<div class="p-4 space-y-2">
								{#if chunks2.length === 0}
									<div class="text-center text-slate-400 py-12 text-sm">No chunks to display.</div>
								{:else}
									{#each chunks2 as chunk, i}
										<div
											class="rounded-lg border-l-4 px-4 py-3 relative"
											style="background-color: {getChunkColor(i, chunks2.length)}; border-left-color: {getBorderColor(i, chunks2.length)}"
										>
											<div class="absolute top-2 right-3 flex items-center gap-2">
												<span class="text-xs font-mono text-slate-500">{chunk.text.length} ch</span>
												<span class="text-xs font-bold text-slate-600 bg-white/60 rounded px-1.5 py-0.5">#{i + 1}</span>
											</div>
											<p class="text-xs font-mono text-slate-800 pr-20 leading-relaxed whitespace-pre-wrap">{chunk.text}</p>
										</div>
									{/each}
								{/if}
							</div>
						</div>
					{/if}

				</div>
			</div>
		</main>
	</div>
</div>
