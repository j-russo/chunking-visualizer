# Chunking Visualizer - Project Instructions

## Overview
Interactive web application to visualize different text chunking strategies, inspired by Brandon Smith's ChromaDB chunking evaluation research (https://research.trychroma.com/evaluating-chunking).

**Purpose:** Demonstrate understanding of chunking for RAG systems and show Svelte competency for Structured AI interview.

**Tech Stack:** SvelteKit + Tailwind CSS  
**Deploy:** Vercel  
**Time Estimate:** 4-5 hours

---

## Project Setup

```bash
# Create SvelteKit project
npm create svelte@latest chunking-visualizer
# Choose: Skeleton project, TypeScript: No, ESLint + Prettier: Yes

cd chunking-visualizer
npm install

# Add Tailwind
npx svelte-add@latest tailwindcss
npm install

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## File Structure

```
chunking-visualizer/
├── src/
│   ├── routes/
│   │   └── +page.svelte          # Main app
│   ├── lib/
│   │   ├── chunkers.js            # Chunking algorithms
│   │   ├── metrics.js             # Calculate metrics
│   │   └── sampleText.js          # Sample construction text
│   └── app.css                    # Tailwind imports
├── static/
│   └── favicon.png
└── README.md
```

---

## Implementation Steps

### Step 1: Chunking Algorithms (`src/lib/chunkers.js`)

Implement 4 chunking strategies:

```javascript
// Fixed character chunking (RecursiveCharacterTextSplitter-inspired)
export function chunkByCharacters(text, size = 200, overlap = 0) {
  const chunks = [];
  let i = 0;
  
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    chunks.push({
      text: text.slice(i, end),
      start: i,
      end: end
    });
    i += size - overlap;
  }
  
  return chunks;
}

// Sentence-based chunking
export function chunkBySentences(text, maxSize = 200) {
  // Split on sentence boundaries
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

// Paragraph-based chunking
export function chunkByParagraphs(text, maxSize = 400) {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let position = 0;
  
  for (const para of paragraphs) {
    if (para.trim()) {
      const chunk = {
        text: para.trim(),
        start: position,
        end: position + para.length
      };
      
      // If paragraph exceeds maxSize, split it further
      if (chunk.text.length > maxSize) {
        const subChunks = chunkBySentences(chunk.text, maxSize);
        chunks.push(...subChunks.map(sc => ({
          ...sc,
          start: sc.start + position,
          end: sc.end + position
        })));
      } else {
        chunks.push(chunk);
      }
    }
    position += para.length + 2; // +2 for \n\n
  }
  
  return chunks;
}

// Semantic chunking (mock - using paragraph breaks as proxy for semantic boundaries)
export function chunkSemantic(text, maxSize = 300) {
  // In reality, this would use embeddings and cosine similarity
  // For demo purposes, we'll use paragraph breaks + sentence boundaries
  return chunkByParagraphs(text, maxSize);
}
```

---

### Step 2: Metrics Calculation (`src/lib/metrics.js`)

```javascript
export function calculateMetrics(chunks) {
  if (!chunks || chunks.length === 0) {
    return {
      count: 0,
      avgSize: 0,
      minSize: 0,
      maxSize: 0,
      totalChars: 0
    };
  }
  
  const sizes = chunks.map(c => c.text.length);
  
  return {
    count: chunks.length,
    avgSize: Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length),
    minSize: Math.min(...sizes),
    maxSize: Math.max(...sizes),
    totalChars: sizes.reduce((a, b) => a + b, 0)
  };
}

// Calculate IoU metric (simplified version from Brandon's paper)
export function calculateIoU(chunks) {
  // In a real implementation, this would compare retrieved chunks vs relevant excerpts
  // For demo, we'll show chunk overlap efficiency
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
  const efficiency = ((totalSize - totalOverlap) / totalSize) * 100;
  
  return Math.round(efficiency);
}
```

---

### Step 3: Sample Text (`src/lib/sampleText.js`)

```javascript
// Sample construction specification text
export const constructionSpec = `SECTION 09 91 00 - PAINTING

PART 1 - GENERAL

1.1 SUMMARY
A. Section Includes: Painting of interior and exterior surfaces including preparation of surfaces for painting.
B. Related Requirements: Section 09 29 00 - Gypsum Board for substrate requirements.

1.2 REFERENCES
A. American Society for Testing and Materials (ASTM):
   1. ASTM D3276 - Standard Guide for Painting Inspectors (Metal Substrates)
   2. ASTM D4258 - Standard Practice for Surface Cleaning Concrete

1.3 SUBMITTALS
A. Product Data: Submit manufacturer's technical data for each paint product including preparation requirements and application instructions.
B. Samples: Submit samples of each color and finish specified.

PART 2 - PRODUCTS

2.1 MANUFACTURERS
A. Acceptable Manufacturers: Benjamin Moore, Sherwin-Williams, or approved equal.

2.2 MATERIALS
A. Interior Latex Paint:
   1. Primer: Water-based acrylic primer sealer
   2. Finish Coat: 100% acrylic latex, semi-gloss finish
   3. VOC Content: Maximum 50 grams per liter

B. Exterior Acrylic Paint:
   1. Base: 100% acrylic latex
   2. Finish: Satin finish
   3. Weather Resistance: Minimum 10-year warranty

PART 3 - EXECUTION

3.1 EXAMINATION
A. Examine surfaces to be painted and verify that surfaces are ready to receive work.
B. Report any defects or damage to surfaces. Do not begin work until defects are corrected.

3.2 PREPARATION
A. Clean surfaces thoroughly. Remove dust, dirt, oil, and grease.
B. Fill cracks and holes with appropriate filler material.
C. Sand smooth all filled areas and previously painted surfaces.

3.3 APPLICATION
A. Apply primer coat to all surfaces. Allow to dry completely before applying finish coats.
B. Apply finish coats in accordance with manufacturer's instructions.
C. Minimum dry film thickness: 1.5 mils per coat.`;

export const drawingNote = `GENERAL NOTES:

1. ALL WORK SHALL CONFORM TO APPLICABLE BUILDING CODES AND REGULATIONS.

2. CONTRACTOR SHALL VERIFY ALL DIMENSIONS IN FIELD BEFORE PROCEEDING WITH WORK.

3. MECHANICAL EQUIPMENT LOCATIONS:
   - HVAC UNITS: ROOF LEVEL, SEE SHEET M-201
   - ELECTRICAL PANELS: BASEMENT LEVEL, SEE SHEET E-101
   - PLUMBING RISERS: AS SHOWN ON EACH FLOOR PLAN

4. CEILING HEIGHTS:
   - TYPICAL OFFICE: 9'-0" ABOVE FINISHED FLOOR
   - CORRIDOR: 8'-6" ABOVE FINISHED FLOOR
   - MECHANICAL ROOM: 10'-0" ABOVE FINISHED FLOOR

5. FIRE PROTECTION: ALL AREAS SHALL BE FULLY SPRINKLERED PER NFPA 13.`;

export const defaultText = constructionSpec;
```

---

### Step 4: Main App UI (`src/routes/+page.svelte`)

```svelte
<script>
  import { chunkByCharacters, chunkBySentences, chunkByParagraphs, chunkSemantic } from '$lib/chunkers';
  import { calculateMetrics, calculateIoU } from '$lib/metrics';
  import { defaultText, constructionSpec, drawingNote } from '$lib/sampleText';
  
  let text = defaultText;
  let strategy = 'characters';
  let chunkSize = 200;
  let overlap = 0;
  let showComparison = false;
  let strategy2 = 'sentences';
  
  $: chunks = getChunks(text, strategy, chunkSize, overlap);
  $: chunks2 = showComparison ? getChunks(text, strategy2, chunkSize, 0) : [];
  $: metrics = calculateMetrics(chunks);
  $: metrics2 = showComparison ? calculateMetrics(chunks2) : null;
  $: efficiency = calculateIoU(chunks);
  
  function getChunks(text, strat, size, olap) {
    switch(strat) {
      case 'characters': return chunkByCharacters(text, size, olap);
      case 'sentences': return chunkBySentences(text, size);
      case 'paragraphs': return chunkByParagraphs(text, size);
      case 'semantic': return chunkSemantic(text, size);
      default: return [];
    }
  }
  
  function getColor(index, total) {
    const hue = (index * 360) / total;
    return `hsl(${hue}, 70%, 85%)`;
  }
  
  function loadSample(sample) {
    text = sample === 'spec' ? constructionSpec : drawingNote;
  }
</script>

<div class="min-h-screen bg-gray-50 p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">Chunking Strategy Visualizer</h1>
      <p class="text-gray-600">
        Inspired by <a href="https://research.trychroma.com/evaluating-chunking" 
           class="text-blue-600 hover:underline" target="_blank">
          Brandon Smith's ChromaDB Chunking Evaluation Research
        </a>
      </p>
    </div>
    
    <!-- Controls -->
    <div class="bg-white rounded-lg shadow-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <!-- Strategy -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Chunking Strategy
          </label>
          <select bind:value={strategy} class="w-full border border-gray-300 rounded-md p-2">
            <option value="characters">Fixed Characters</option>
            <option value="sentences">Sentence-based</option>
            <option value="paragraphs">Paragraph-based</option>
            <option value="semantic">Semantic (mock)</option>
          </select>
        </div>
        
        <!-- Chunk Size -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Max Chunk Size: {chunkSize} chars
          </label>
          <input 
            type="range" 
            bind:value={chunkSize} 
            min="100" 
            max="800" 
            step="50"
            class="w-full"
          />
        </div>
        
        <!-- Overlap -->
        {#if strategy === 'characters'}
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Overlap: {overlap} chars
            </label>
            <input 
              type="range" 
              bind:value={overlap} 
              min="0" 
              max={Math.floor(chunkSize / 2)} 
              step="25"
              class="w-full"
            />
          </div>
        {/if}
        
        <!-- Comparison Mode -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Compare Strategies
          </label>
          <label class="flex items-center">
            <input type="checkbox" bind:checked={showComparison} class="mr-2" />
            <span class="text-sm">Enable comparison</span>
          </label>
          {#if showComparison}
            <select bind:value={strategy2} class="w-full border border-gray-300 rounded-md p-2 mt-2">
              <option value="characters">Fixed Characters</option>
              <option value="sentences">Sentence-based</option>
              <option value="paragraphs">Paragraph-based</option>
              <option value="semantic">Semantic (mock)</option>
            </select>
          {/if}
        </div>
      </div>
      
      <!-- Sample Text Buttons -->
      <div class="flex gap-2">
        <button 
          on:click={() => loadSample('spec')}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Load Construction Spec
        </button>
        <button 
          on:click={() => loadSample('notes')}
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Load Drawing Notes
        </button>
      </div>
    </div>
    
    <!-- Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">Chunks</div>
        <div class="text-2xl font-bold text-gray-900">{metrics.count}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">Avg Size</div>
        <div class="text-2xl font-bold text-gray-900">{metrics.avgSize}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">Min Size</div>
        <div class="text-2xl font-bold text-gray-900">{metrics.minSize}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">Max Size</div>
        <div class="text-2xl font-bold text-gray-900">{metrics.maxSize}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-4">
        <div class="text-sm text-gray-600">Efficiency</div>
        <div class="text-2xl font-bold text-gray-900">{efficiency}%</div>
      </div>
    </div>
    
    <!-- Main Content -->
    <div class="grid {showComparison ? 'grid-cols-2' : 'grid-cols-1'} gap-6">
      <!-- Primary View -->
      <div>
        <div class="bg-white rounded-lg shadow-md p-6 mb-4">
          <h2 class="text-xl font-bold mb-4">
            {strategy.charAt(0).toUpperCase() + strategy.slice(1)} Chunking
          </h2>
          
          <!-- Text Input -->
          <textarea 
            bind:value={text}
            class="w-full h-48 p-4 border border-gray-300 rounded-md mb-4 font-mono text-sm"
            placeholder="Paste your text here..."
          />
          
          <!-- Visualization -->
          <div class="space-y-2">
            {#each chunks as chunk, i}
              <div 
                class="p-4 rounded-md border-l-4 relative"
                style="background-color: {getColor(i, chunks.length)}; border-left-color: {getColor(i, chunks.length).replace('85%', '50%')}"
              >
                <div class="absolute top-2 right-2 text-xs font-bold text-gray-600">
                  Chunk {i + 1} ({chunk.text.length} chars)
                </div>
                <div class="text-sm text-gray-800 font-mono pr-24">
                  {chunk.text}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Comparison View -->
      {#if showComparison}
        <div>
          <div class="bg-white rounded-lg shadow-md p-6 mb-4">
            <h2 class="text-xl font-bold mb-4">
              {strategy2.charAt(0).toUpperCase() + strategy2.slice(1)} Chunking
            </h2>
            
            <div class="h-48 mb-4 flex items-center justify-center bg-gray-50 rounded-md">
              <div class="text-center">
                <div class="text-4xl font-bold text-gray-900">{metrics2.count}</div>
                <div class="text-sm text-gray-600">chunks (avg {metrics2.avgSize} chars)</div>
              </div>
            </div>
            
            <!-- Visualization -->
            <div class="space-y-2">
              {#each chunks2 as chunk, i}
                <div 
                  class="p-4 rounded-md border-l-4 relative"
                  style="background-color: {getColor(i, chunks2.length)}; border-left-color: {getColor(i, chunks2.length).replace('85%', '50%')}"
                >
                  <div class="absolute top-2 right-2 text-xs font-bold text-gray-600">
                    Chunk {i + 1} ({chunk.text.length} chars)
                  </div>
                  <div class="text-sm text-gray-800 font-mono pr-24">
                    {chunk.text}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>
    
    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-500">
      <p>
        Built to explore chunking strategies for construction document processing.
        Based on research by Brandon Smith (ChromaDB).
      </p>
    </div>
  </div>
</div>
```

---

## README.md

```markdown
# Chunking Visualizer

Interactive visualization of text chunking strategies for RAG (Retrieval-Augmented Generation) systems.

## Inspiration

This project is inspired by [Brandon Smith's research on evaluating chunking strategies](https://research.trychroma.com/evaluating-chunking) conducted at ChromaDB. His work demonstrates that chunking strategy significantly impacts retrieval performance, with some strategies outperforming others by up to 9% in recall.

## Features

- **4 Chunking Strategies:**
  - Fixed character chunking (with configurable overlap)
  - Sentence-based chunking
  - Paragraph-based chunking
  - Semantic chunking (mock implementation)

- **Real-time Metrics:**
  - Chunk count
  - Average, min, max chunk sizes
  - Efficiency calculation (IoU-inspired)

- **Comparison Mode:** Side-by-side visualization of different strategies

- **Sample Construction Text:** Pre-loaded with construction specifications and drawing notes

## Why This Matters

For Structured AI's construction document QA/QC product, optimal chunking is critical for:
- Accurate retrieval of code requirements across 2000+ page documents
- Cross-referencing between drawings and specifications
- Maintaining semantic coherence for compliance checking

## Tech Stack

- SvelteKit
- Tailwind CSS
- Deployed on Vercel

## Local Development

```bash
npm install
npm run dev
```

## References

- [Evaluating Chunking Strategies for Retrieval](https://research.trychroma.com/evaluating-chunking) - Brandon Smith, ChromaDB
- [GitHub: chunking_evaluation](https://github.com/brandonstarxel/chunking_evaluation)
```

---

## Deployment Instructions

```bash
# Build for production
npm run build

# Deploy to Vercel (one command)
npx vercel

# Or connect GitHub repo to Vercel dashboard for auto-deploy
```

---

## Interview Talking Points

**When showing to Brandon (CTO):**

1. **Understanding his research:**
   - "I read your ChromaDB paper on chunking evaluation. Really interesting how RecursiveCharacterTextSplitter with 200-token chunks and no overlap achieved the best precision while maintaining good recall."
   
2. **Application to Structured AI:**
   - "For construction drawings, I'm curious how you're chunking. Are you going page-by-page, or chunking at the element level (like individual specs, notes, dimensions)?"
   
3. **Technical depth:**
   - "Your ClusterSemanticChunker is fascinating - maximizing cosine similarity within chunks. For construction docs, I imagine you'd want chunks that preserve relationships like 'code requirement → applicable drawing detail.'"

4. **Future improvements:**
   - "This is a simplified visualization, but in production I'd implement actual embedding-based semantic chunking using your approach. Also add IoU calculation against ground-truth excerpts."

---

## Success Criteria

By the end of 4-5 hours, you should have:

✅ Working Svelte app deployed to Vercel  
✅ 4 chunking strategies implemented  
✅ Visual chunk display with color coding  
✅ Real-time metrics  
✅ Comparison mode  
✅ Sample construction text  
✅ Clean README referencing Brandon's research  
✅ GitHub repo with good commit messages

---

## Tips for Speed

1. **Don't overthink styling** - Tailwind utility classes are fast
2. **Use simple color generation** - HSL with index-based hue
3. **Mock the semantic chunking** - Don't implement real embeddings
4. **Copy sample text** - Don't write it from scratch
5. **Deploy early** - Get it on Vercel in hour 4, polish in hour 5

---

## Next Steps

After completing this, move on to the PDF Drawing Annotator (tomorrow, 6-8 hours).

Good luck! This will be a strong technical demonstration for the CTO conversation.
