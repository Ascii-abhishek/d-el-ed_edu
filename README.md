# D.El.Ed Learning

Static bilingual learning website for Diploma in Elementary Education students.

This project is intentionally simple: plain HTML, CSS, and JavaScript only. It is designed to deploy directly on Cloudflare Pages without a build step, login system, database, backend, or framework.

## LLM Handoff Summary

Use this section as context when asking another LLM to update the website.

The website is a browser-only D.El.Ed learning portal. Students first land on a home page and choose one of four semesters. After choosing a semester, they enter a course-reader interface inspired by ByteByteGo: a dark left sidebar for navigation and progress, and a large right-side reading area for the selected content.

The site supports two languages for now: English (`en`) and Hindi (`hi`). All semester names, subject names, topic names, summaries, and lesson content should exist in both languages. The language toggle changes the whole interface and loads the matching markdown content file. Student progress is stored only in the browser with `localStorage`.

## Design Intent

- Home page: clean, simple, and focused on selecting a semester.
- Reader page: two-panel learning layout.
- Left panel: semester/subject title, progress count, reset button, progress bar, and navigation list.
- Right panel: actual learning content rendered from markdown.
- Mobile: sidebar can collapse/expand using the round button that remains visible when collapsed.
- Top bar: must stay on every page with site logo/name on the left and controls on the right.
- Controls: language toggle, theme button, font size increase/decrease, and font style selector.
- Visual style: quiet educational interface, readable typography, minimal decoration, clear spacing.

## Structure

- `index.html` - single page app shell.
- `assets/css/` - global and reader layout styles.
- `assets/js/catalog.js` - semester, subject, topic, and content file mapping.
- `assets/js/app.js` - hash routing, sidebar navigation, progress marking.
- `assets/js/settings.js` - language, theme, and font controls saved in browser storage.
- `assets/js/i18n.js` - interface labels in English and Hindi.
- `assets/js/markdown.js` - small markdown-to-HTML renderer.
- `content/<language>/semester-*/...` - markdown lesson files.

## Important Files

### `index.html`

Contains the app shell and top bar. Avoid putting semester, subject, or lesson content here. Content should be added through `catalog.js` and markdown files.

### `assets/js/catalog.js`

This is the main content map. It defines:

- semesters
- subjects inside each semester
- topics inside each subject
- English and Hindi display text
- English and Hindi markdown file paths

When adding any new content, update this file first so the app knows where the content lives.

### `content/en/...` and `content/hi/...`

These folders contain the actual lesson files. Each topic should have one English markdown file and one Hindi markdown file.

Recommended path pattern:

```txt
content/en/semester-1/subject-slug/topic-slug.md
content/hi/semester-1/subject-slug/topic-slug.md
```

Example:

```txt
content/en/semester-1/childhood-and-development/meaning-of-childhood.md
content/hi/semester-1/childhood-and-development/meaning-of-childhood.md
```

## How Routing Works

The app uses hash routing so it works on static hosting.

Examples:

```txt
#/
#/semester/1
#/semester/1/subject/childhood-and-development
#/semester/1/subject/childhood-and-development/topic/meaning-of-childhood
```

No server-side routing is required.

## How To Add A New Topic

1. Create the English markdown file:

```txt
content/en/semester-1/example-subject/example-topic.md
```

2. Create the Hindi markdown file:

```txt
content/hi/semester-1/example-subject/example-topic.md
```

3. Add the topic entry inside the correct subject in `assets/js/catalog.js`:

```js
{
  id: "example-topic",
  title: {
    en: "Example Topic",
    hi: "उदाहरण टॉपिक"
  },
  summary: {
    en: "Short one-line summary for the topic.",
    hi: "टॉपिक का छोटा एक-पंक्ति सारांश।"
  },
  file: {
    en: "content/en/semester-1/example-subject/example-topic.md",
    hi: "content/hi/semester-1/example-subject/example-topic.md"
  }
}
```

## How To Add A New Subject

Add a new subject object inside the correct semester in `assets/js/catalog.js`.

Subject shape:

```js
{
  id: "subject-slug",
  title: {
    en: "Subject Name",
    hi: "विषय का नाम"
  },
  summary: {
    en: "Short description of what the subject contains.",
    hi: "विषय में क्या शामिल है इसका छोटा विवरण।"
  },
  topics: [
    // topic objects go here
  ]
}
```

Then create matching markdown files under:

```txt
content/en/semester-x/subject-slug/
content/hi/semester-x/subject-slug/
```

## How To Add Or Edit A Semester

Semesters are listed in `assets/js/catalog.js` under `window.COURSE_CATALOG.semesters`.

Each semester has:

- `id`
- bilingual `title`
- bilingual `summary`
- `subjects`

There are currently four semesters. If the real D.El.Ed structure changes by state/board/university, update the semester and subject list in `catalog.js`.

## Markdown Content Guidelines

Use simple markdown. The current renderer supports:

- `# Heading`
- `## Heading`
- `### Heading`
- paragraphs
- unordered lists with `-`
- numbered lists like `1.`
- bold text with `**bold**`
- italic text with `*italic*`

Recommended lesson format:

```md
# Topic Title

Short introduction paragraph.

## Key Points

- Point one.
- Point two.
- Point three.

## Classroom Connection

Explain how this topic applies to elementary classrooms.

## Reflect

Add one question or activity for the student.
```

Keep language simple and useful for D.El.Ed students. Prefer examples from elementary classrooms, school internships, child observation, lesson planning, assessment, and local/community context.

## Browser Storage

The site uses `localStorage` for:

- selected language
- selected theme
- font size
- font style
- completed topic progress

There is no login. Progress is device/browser specific.

## Styling Notes

- Global layout and top bar styles live in `assets/css/base.css`.
- Reader/sidebar/content styles live in `assets/css/reader.css`.
- Use CSS variables in `:root` for colors and typography.
- Keep the reader layout close to the current two-panel design.
- Do not add a heavy landing page; the home page should stay practical and semester-focused.
- Make sure mobile layout remains usable after any sidebar or content changes.

## Deployment

Deploy the repository root directly to Cloudflare Pages as a static site. No build step is required.

## Local Preview

Because lesson files are loaded with `fetch`, preview with a small local server:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Current Placeholder Content

The current subject/topic list is sample placeholder content. In the next iteration, replace or expand it with researched D.El.Ed syllabus-aligned content. When researching, keep the `catalog.js` structure stable and update markdown files topic by topic.
