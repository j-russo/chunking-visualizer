/**
 * Fixed character chunking — analogous to LangChain's RecursiveCharacterTextSplitter.
 * Best precision in Brandon Smith's benchmarks at ~200 chars with no overlap.
 */
export function chunkByCharacters(text, size = 200, overlap = 0) {
	const chunks = [];
	let i = 0;

	while (i < text.length) {
		const end = Math.min(i + size, text.length);
		chunks.push({ text: text.slice(i, end), start: i, end });
		i += size - overlap;
	}

	return chunks;
}

/**
 * Sentence-based chunking — accumulates sentences until maxSize is reached.
 * Uses lookbehind regex to split on sentence boundaries.
 */
export function chunkBySentences(text, maxSize = 200) {
	const sentences = text.split(/(?<=[.!?])\s+/);
	const chunks = [];
	let current = { text: '', start: 0, end: 0 };
	let position = 0;

	for (const sentence of sentences) {
		if ((current.text + sentence).length > maxSize && current.text) {
			current.end = position;
			chunks.push({ ...current });
			current = { text: sentence + ' ', start: position, end: 0 };
		} else {
			current.text += sentence + ' ';
		}
		position += sentence.length + 1;
	}

	if (current.text.trim()) {
		current.end = text.length;
		chunks.push(current);
	}

	return chunks;
}

/**
 * Paragraph-based chunking — splits on blank lines, falls back to sentence
 * chunking for paragraphs that exceed maxSize.
 */
export function chunkByParagraphs(text, maxSize = 400) {
	const paragraphs = text.split(/\n\s*\n/);
	const chunks = [];
	let position = 0;

	for (const para of paragraphs) {
		if (para.trim()) {
			const chunk = { text: para.trim(), start: position, end: position + para.length };

			if (chunk.text.length > maxSize) {
				const subChunks = chunkBySentences(chunk.text, maxSize);
				chunks.push(
					...subChunks.map((sc) => ({
						...sc,
						start: sc.start + position,
						end: sc.end + position
					}))
				);
			} else {
				chunks.push(chunk);
			}
		}
		position += para.length + 2; // +2 for \n\n
	}

	return chunks;
}

/**
 * Semantic chunking — mock implementation using paragraph boundaries as a
 * proxy for semantic boundaries. A real implementation would use embeddings
 * and cosine similarity (see Brandon Smith's ClusterSemanticChunker).
 */
export function chunkSemantic(text, maxSize = 300) {
	return chunkByParagraphs(text, maxSize);
}
