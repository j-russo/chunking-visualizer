# Chunking Visualizer

Interactive visualization of text chunking strategies for RAG (Retrieval-Augmented Generation) systems, with a focus on construction document processing.

## Inspiration

Inspired by [Brandon Smith's research on evaluating chunking strategies](https://research.trychroma.com/evaluating-chunking) at ChromaDB. His benchmarks found `RecursiveCharacterTextSplitter` with ~200-character chunks and no overlap to be consistently high-performing across all evaluation metrics. This demo uses 200 characters as the default, applying that finding to construction documents — where spec sections tend to be short and dense.

## Chunking Strategies

| Strategy | Description | Best for | Degrades when |
|---|---|---|---|
| **Fixed Characters** | Splits at a fixed character count with configurable overlap | Dense prose, benchmark baselines | Queries that span paragraph breaks |
| **Sentence-based** | Accumulates sentences until the size limit, preserving sentence integrity via lookbehind regex | Narrative text, QA use cases | Sentence-fragmented OCR output |
| **Paragraph-based** | Splits on blank lines; falls back to sentence chunking for oversized paragraphs | Well-formatted specifications | Scanned drawings with no structural markers |
| **Semantic (mock)** | Uses paragraph boundaries as a proxy for semantic coherence. **Not real semantic chunking** — a production implementation would embed each sentence, compute cosine similarity between adjacent sentences, and split where similarity drops below a threshold (ClusterSemanticChunker pattern). | Demo purposes | Any case requiring true topic-boundary detection |

## Metrics

**Standard metrics** (count, avg/min/max size, total chars) are self-explanatory.

**Efficiency** is an overlap-ratio metric — it measures what fraction of total character coverage is non-overlapping. It is *not* true Intersection over Union: real IoU requires ground-truth labeled data (known correct answer spans) to compare retrieved chunks against. This metric is a useful proxy for identifying waste from overlap configuration, not a retrieval quality score.

## Why Chunking Matters for Construction Docs

Construction document sets are complex: a 500-page set combines title sheets, floor plans, sections, details, schedules, and specifications — each requiring different treatment.

- **Specifications** (Division 03 Concrete, etc.) are text-dense and chunk well with structural or semantic approaches. A critical constraint: don't chunk across division boundaries. A chunk bleeding from Division 03 into Division 04 is useless for compliance QA.
- **Drawing sheets** need OCR + spatial parsing to preserve relationships between callout bubbles, keynotes, and the geometry they reference. Standard text chunking destroys this spatial context.
- **Schedules** (door schedules, finish schedules) should be extracted as structured data, not chunked as prose. A door schedule parsed as structured rows is far more useful for QA queries than the same content split into arbitrary text windows.
- **Metadata** — page number, section heading, drawing number, discipline (structural/MEP/arch) — is what makes retrieval actually useful for queries like "find all fire-rated assembly specs."

## Production Pipeline Considerations

At scale, a document-type-aware pipeline handles these requirements:

1. **Classify first** — determine whether each page/section is a spec, drawing, or schedule before selecting an extraction strategy
2. **Route to the appropriate extractor** — text extraction for specs, OCR + spatial parsing for drawings, structured parsing for schedules
3. **Async job queue** — one job per document, pages as sub-tasks processed in parallel workers; track status: `pending → extracting → chunking → indexed → ready`
4. **Client-side chunking** (as in this demo) works for pre-extracted text but breaks down when ML-based embedding inference is needed for semantic splitting, or when PDFs require server-side OCR

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
