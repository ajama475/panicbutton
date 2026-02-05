# Vision Document: PanicButton
## Emergency Clarity for Academic Panic Moments



## 1. Executive Summary

PanicButton is a student-created academic clarity tool for times of extreme anxiety when deadlines feel buried, knowledge is fragmented, and time is limited.

PanicButton is more of a document-to-structure pipeline than a planner, learning management system, or institutional authority. It converts unstructured academic documents (such as syllabus PDFs) into transparent, reviewable deadlines, allowing students to restore orientation and control swiftly.

The name *PanicButton* reflects the moment of use, not the outcome. The system’s purpose is rapid de-escalation through clarity.



## 2. The Problem: Academic Information Fails When Students Need It Most

University students routinely face moments of panic caused by uncertainty, not lack of effort.

### The Classic Panic Scenario

A student in Week 5 suddenly realizes they may have numerous midterms coming up, but they can't recall which dates were given in which syllabus PDF. They rush through emails, course webpages, and buried paperwork, squandering time and increasing stress.

Critical academic information is often:
- buried in long, unstructured syllabus PDFs
- scattered across emails, announcements, and multiple platforms
- written in inconsistent formats by different instructors
- difficult to mentally aggregate under time pressure

As a result, students spend excessive time asking:
- “What is actually due?”
- “Am I missing something important?”
- “Where did this deadline come from?”

These are time-sensitive and stressful situations, but current methods presume calm, proactive planning rather than reactive clarity.



## 3. The Insight

The core problem is not organization, it is **interpretation under pressure**.

When students are panicking, they do not want:
- to set up a full planning system
- to manually copy dates into a calendar
- to navigate multiple platforms

They want one thing:

> A fast, trustworthy starting point for clarity.



## 4. The Solution: PanicButton

PanicButton is designed as an **emergency clarity tool**.

It allows a student to upload a syllabus and, within seconds:
- see what deadlines appear to matter
- understand where each extracted deadline came from
- review and correct ambiguity instead of guessing

The system prioritizes speed, transparency, and honest uncertainty over completeness or automation.



## 5. Phase 1 Focus (Deliberately Narrow)

Phase 1 of PanicButton focuses on a single promise:

> Upload one syllabus → understand your deadlines.

To maintain trust and feasibility, PanicButton:
- operates only on user-provided documents
- does not scrape or integrate with institutional systems
- does not claim to be a source of truth

This narrow scope ensures immediate value with minimal setup.



## 6. Core Feature: Deadline Extraction & Review

### Input
- Syllabus PDFs or pasted course text

### Processing
- Text extraction from documents
- Detection of dates, times, and deadline-related language
- Confidence scoring for each extracted item

### Output
- A unified list of potential deadlines
- Highlighted source snippets for verification
- Clear indicators of uncertainty or ambiguity
- Optional calendar export (`.ics`) after review

### Key Differentiator
The value is not just extraction, but also the quick, low-cognitive-load review cycle that converts a jumbled document into a trustworthy list. The method is intended to supplement human-in-the-loop correction, not to replace student judgment.



## 7. Technical Highlights

PanicButton is built as a document-parsing and normalization system with:
- client-side PDF parsing for privacy and zero server dependency
- rule-based deadline detection with configurable confidence scoring
- in-browser `.ics` calendar generation
- deterministic extraction logic and transparent confidence modeling

The architecture emphasizes correctness, explainability, and reproducibility over feature breadth.



## 8. Design Principles

### Designed for Panic
- minimal onboarding
- immediate results
- no required accounts in Phase 1

### Explainability First
- every extracted deadline shows its source
- no hidden logic or black-box decisions

### Honest Uncertainty
- confidence scores instead of false certainty
- ambiguous cases are surfaced, not hidden

### Calm by Design
- neutral language
- no alarmist visuals
- no countdowns or pressure mechanics



## 9. What PanicButton Is Not

PanicButton is intentionally not:
- a planner or task manager
- a replacement for official university systems
- a degree-audit or advising tool
- a real-time synchronization platform

Its role is to provide clarity at the moment it is most needed.


## 13. Success Criteria (Phase 1)

PanicButton is successful if:
- a student can go from PDF upload to reviewed deadline list in under 90 seconds
- users trust the output because they can verify every extracted item
- setup time is significantly lower than manual calendar entry
- the system measurably reduces uncertainty during moments of academic stress



**Document Version:** 1.0  

