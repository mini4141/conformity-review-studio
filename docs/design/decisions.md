# Design decisions

Each decision is defended in a sentence or two. Principles are in [principles.md](principles.md).

**Three resizable panes (clauses | document | findings).** The reviewer's loop is checklist, source, claim; keeping all three visible removes the tab-switching that Word + Acrobat + a spreadsheet force. Pane sizes persist per user because experts tune their layout once and expect it to stay.

**Fixed order of panes, evidence in the middle.** The document is the largest pane and sits between the question (clause) and the answer (finding), so the eye travels left to right in reading order.

**Inter, 13px body, 12px compact.** Inter has excellent small-size legibility and tabular numerals; 13px is the smallest size that stays comfortable for hours, and 12px is the floor for compact mode where rows drop from 32 to 24px.

**Type scale 10.5 / 11 / 12 / 13 / 15 / 18 / 22.** A tight scale with small steps: headings only need to be slightly larger than body in a dense UI, and a large jump would waste vertical space.

**Row height as a token (`--row-h`).** The virtualized table needs to know row height numerically, so density is a token pair: CSS uses `--row-h`, and the table receives the matching pixel value from `ROW_HEIGHT`.

**Virtualization for every long list.** The matrix, queue and PDF pages are virtualized (TanStack Virtual) so 180 rows or 412 pages cost the same as ten; the matrix is measured at about 59 fps while scrolling.

**Sticky header and pinned first column.** In a 13-column grid the clause id is the row identity; pinning it keeps context when scrolling horizontally.

**Keyboard-first with visible affordances.** `j`/`k`, `a`, `r`, `e`, `g c`, `Cmd/Ctrl+K`, `?`. Every shortcut is printed on its button as a key cap, listed in the shortcut sheet and available in the palette, so experts go fast and newcomers can discover them.

**Command palette (cmdk) for navigation and actions.** Searching 180 clauses by number or title is faster than scrolling, and the same palette runs actions, so no function is mouse-only.

**Selected clause lives in the URL (`?clause=8.4.2`).** Reload-safe and shareable: a reviewer can paste a link to exactly one finding in a message to a colleague.

**Corrections need a reason and keep the original.** The model's output is evidence in an audit; overwriting it would erase what the reviewer corrected. A word-level diff shows what changed at a glance.

**Verdict colours with text labels.** Four semantic colours, each paired with its word, so colour-blind users and screenshots in grayscale lose nothing.

**Highlights are drawn over the PDF text layer.** The evidence rectangle is computed from pdf.js text positions, so it follows zoom and stays pixel-aligned, and the text layer remains selectable.

**Design system in `packages/ui`.** Tokens in CSS custom properties so a theme or density change is an attribute switch with no re-render. Components are documented in Storybook, tested for accessibility with axe, and every one is used in a real screen.

**Motion library only where it carries meaning.** Pulse, state springs, toasts and route fades use Motion; hover and focus use CSS transitions.
