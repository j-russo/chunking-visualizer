export function calculateMetrics(chunks) {
	if (!chunks || chunks.length === 0) {
		return { count: 0, avgSize: 0, minSize: 0, maxSize: 0, totalChars: 0 };
	}

	const sizes = chunks.map((c) => c.text.length);
	const total = sizes.reduce((a, b) => a + b, 0);

	return {
		count: chunks.length,
		avgSize: Math.round(total / sizes.length),
		minSize: Math.min(...sizes),
		maxSize: Math.max(...sizes),
		totalChars: total
	};
}

/**
 * Simplified IoU-inspired overlap efficiency metric.
 * Measures how much of the total character coverage is non-overlapping.
 * A real implementation would compare retrieved chunks against ground-truth
 * relevant excerpts as described in Brandon Smith's ChromaDB paper.
 */
export function calculateIoU(chunks) {
	if (chunks.length < 2) return 100;

	let totalOverlap = 0;
	for (let i = 1; i < chunks.length; i++) {
		const prev = chunks[i - 1];
		const curr = chunks[i];
		if (curr.start < prev.end) {
			totalOverlap += prev.end - curr.start;
		}
	}

	const totalSize = chunks.reduce((sum, c) => sum + c.text.length, 0);
	return Math.round(((totalSize - totalOverlap) / totalSize) * 100);
}
