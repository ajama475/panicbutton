## Phase 1 — Problem Research & Ground Truth
- [x] Collect 5+ real syllabus PDFs from personal archives & public sources
- [x] Create ground-truth spreadsheet with manual deadline extraction
- [x] Document observed date formats, edge cases, and syllabus structures
- [x] Time manual deadline extraction process for baseline comparison

## Phase 2 — PDF Parsing & Rule-Based Extraction
- [x] Initialize Next.js 14 project with Tailwind & TypeScript
- [x] Configure PDF.js Legacy Engine for browser compatibility
- [x] Build client-side PDF → raw text extraction (no file storage)
- [x] Implement rule-based date detection with year inference
- [x] Handle dense grading tables via line chunking and keyword anchoring
- [x] Assign confidence scores with explainable heuristics
- [x] Surface evidence snippets and matched keywords for user verification
- [x] Detect conditional deadlines (e.g., deferred / if granted)
- [x] Deduplicate overlapping date matches
- [x] Support optional time extraction (12h / 24h formats)

## Phase 3 — Review, Editing, & Export (Current)
- [x] Display extracted deadlines in a reviewable candidate list
- [x] Allow manual edits (title, type, date, time, confidence)
- [x] Allow manual deadline creation for missed items
- [x] Flag conditional events visually in the UI
- [x] Export verified deadlines to `.ics` calendar format
- [x] Ensure all processing happens client-side for privacy
- [x] Modernize UI for clarity, calmness, and ease of use

### Next Focus
- [ ] Broaden testing across diverse syllabus formats (non-table layouts, scanned PDFs)
- [ ] Improve handling of multi-line assessment descriptions
- [ ] Optional: persist user preferences (confidence threshold, assumed year) locally



