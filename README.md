# Chunking Visualizer

Interactive visualization of text chunking strategies for RAG (Retrieval-Augmented Generation) systems, with a focus on construction document processing.

## Inspiration

Inspired by [Brandon Smith's research on evaluating chunking strategies](https://research.trychroma.com/evaluating-chunking) at ChromaDB. His work demonstrates that chunking strategy significantly impacts retrieval performance — `RecursiveCharacterTextSplitter` with ~200-token chunks and no overlap achieved the best precision while maintaining strong recall in his benchmarks.

## Features

**4 Chunking Strategies:**
- **Fixed Characters** — splits at a fixed character count with configurable overlap (analogous to `RecursiveCharacterTextSplitter`)
- **Sentence-based** — accumulates sentences until size limit, preserving sentence integrity
- **Paragraph-based** — splits on blank lines; falls back to sentence chunking for oversized paragraphs
- **Semantic (mock)** — uses paragraph boundaries as a proxy; production use would apply embedding cosine similarity (ClusterSemanticChunker)

**Real-time Metrics:**
- Chunk count, average / min / max sizes, total characters
- Efficiency score — simplified IoU-inspired overlap metric

**Comparison Mode:** Side-by-side visualization of any two strategies against the same text

**Sample Construction Text:** Pre-loaded construction specifications and drawing general notes — the domain Structured AI targets for QA/QC

## Why Chunking Matters for Construction Docs

Optimal chunking is critical for accurate retrieval across 2000+ page construction documents:
- Code requirements must be retrieved alongside applicable drawing details
- Cross-referencing between specifications and drawings requires semantic coherence
- Compliance checking depends on preserving full clause context within a chunk

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

## Local Development

```bash
npm install
npm run dev
```

## References

- [Evaluating Chunking Strategies for Retrieval](https://research.trychroma.com/evaluating-chunking) — Brandon Smith, ChromaDB
- [chunking_evaluation GitHub](https://github.com/brandonstarxel/chunking_evaluation)
