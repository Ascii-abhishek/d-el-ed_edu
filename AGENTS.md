# Agent Instructions

This repository is a plain static D.El.Ed learning website. Keep it simple: HTML, CSS, and JavaScript only. Do not introduce a framework, build step, backend, login, database, or heavy dependency unless the project owner explicitly asks for it.

## First Read

- Read `README.md` before changing content or layout.
- Check `assets/js/catalog.js` before adding any subject or topic.
- Check existing files in `content/en` and `content/hi` before writing new lessons.
- Preserve user changes. Do not revert unrelated edits.

## Content Workflow

- Research the real course name, semester, subject, and chapter list before adding academic content.
- Prefer official SCERT/board/university sources. If official sources are not reachable, use multiple credible syllabus/book sources and mention the assumption in your final response.
- Add all display names, summaries, and lesson file paths in both English and Hindi.
- Create matching English and Hindi markdown files for completed topics.
- If only some lessons are requested, add the complete topic map but generate full content only for the requested lessons.

## Site Architecture

- `index.html` is only the app shell.
- `assets/js/catalog.js` owns semester, subject, topic, summary, and content path mapping.
- `content/en/...` and `content/hi/...` own lesson content.
- `assets/js/markdown.js` owns supported markdown features.
- `assets/css/base.css` and `assets/css/reader.css` own visual styling.

## Lesson Style

- Use crash-course, last-minute revision style.
- Prefer bullets, short tables, quick diagrams, exam lines, and classroom examples.
- Avoid long theory blocks.
- Keep language clear for D.El.Ed students.
- Include practical elementary-school classroom connections when useful.
- Do not copy large passages from sources. Rewrite in original, student-friendly language.

## Bilingual Requirements

- Every catalog title and summary must have `en` and `hi`.
- Every completed topic should have one English markdown file and one Hindi markdown file.
- Hindi should be natural and readable, not word-by-word translation.

## Verification

- Run a quick syntax or browser check when changing JavaScript.
- For visual/content changes, open the static site or run a local static server if needed.
- Confirm that the route, sidebar, language toggle, and lesson rendering work.
