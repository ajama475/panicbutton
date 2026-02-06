# Demo Syllabi

These files represent real-world syllabus variations for testing PanicButton.

## `syllabus-clean.pdf`
- **Type:** "Golden path" — well-structured, digital-native PDF
- **Characteristics:** Clear headings, bulleted lists, consistent date formats
- **Goal:** Should achieve >90% extraction accuracy
- **Use case:** First-run demo, confidence builder

## `syllabus-messy.pdf`
- **Type:** Real-world complex syllabus
- **Characteristics:** Tables, multi-column layouts, mixed date formats, embedded images
- **Goal:** Tests parsing resilience and confidence scoring
- **Use case:** Edge case handling, precision/recall trade-offs

## `syllabus-scanned.pdf` (optional)
- **Type:** "Known failure case" — image-based PDF
- **Characteristics:** Scanned pages, no selectable text
- **Goal:** Demonstrate graceful degradation
- **Use case:** Setting realistic expectations, UI messaging for unsupported formats

## Usage
- Development: Use for parser testing and validation
- Demonstration: Show how PanicButton handles different real-world documents
- Evaluation: Measure accuracy improvements across document types
