# Design principles

Conformity Review Studio is a tool for experts who spend hours a day in it. These five principles decide every layout, size and interaction.

## 1. Density is a feature, not a flaw
A reviewer compares a clause, a page and an AI claim at the same time. Every pixel of chrome is a pixel not spent on evidence, so the interface uses a 4px spacing scale, 12 to 13px body text, 24 to 32px rows and one thin top bar. The compact/comfortable toggle changes row height, padding and body size together, because a dense screen is only useful if the user can choose how dense.

## 2. Hierarchy comes from structure, not decoration
The three panes are always in the same order: where am I (clause list), what does the document say (viewer), what does the AI claim (findings). Within a pane, weight and position carry the hierarchy: a bold clause number, a regular title, muted metadata. There are no shadows or gradients on content, only on things that float (palette, popovers, toasts).

## 3. Typography built for numbers
Inter at small sizes with tabular numerals everywhere a number can be compared down a column (pages, confidence, due dates, counts). Clause numbers are a primary identifier, so they are tabular and medium weight. Long text is truncated with an ellipsis and a tooltip with the full value rather than wrapped, because uneven row heights destroy scan speed.

## 4. Colour is for meaning only
One accent (indigo) marks selection and the primary action. Green, amber, red and blue are reserved for verdicts (Satisfied, Partially, Not demonstrated, Needs info) and are never used decoratively. Colour is never the only carrier: every verdict is also spelled out as text. Light and dark themes both pass WCAG AA contrast, checked by axe in CI.

## 5. Motion with purpose
Motion answers "what just happened?" and nothing else: the evidence highlight pulses when a jump lands, a finding's state badge springs in when it is accepted, rejected or corrected, toasts slide in and out, routes fade in 140 ms. Durations are 90 to 260 ms with one ease curve. Everything respects `prefers-reduced-motion` and collapses to instant.

## Trust in AI output
The AI proposes and the human decides, so every finding shows its evidence quote with a page link, a confidence meter, the rule or model that produced it and the reviewer's override history. A correction requires a reason, keeps the AI's original and renders a diff. Nothing the AI says is shown without the means to verify it in one click.
