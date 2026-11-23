# /xservicesx design reference

Design source files exported from the "Services Hero Concepts" canvas.
They are REFERENCE ONLY. Do not ship them and do not import them.

How to read them:
- Markup and inline styles inside <x-dc> are the visual source of truth (sizes, colours, spacing, radius, shadows).
- Classes and keyframes are in the <helmet><style> block at the top of each file.
- Behaviour is in the <script type="text/x-dc"> block: `state`, `setState` and `renderVals()` show exactly how each interaction works.
- `{{name}}` holes are filled from renderVals(); <sc-for> is a loop, <sc-if> is a conditional.
- Text in [square brackets] is a placeholder for a fact not yet confirmed. Never ship brackets.

Files: 00 buttons, 01 hero (desktop only, phone is described in the build prompt),
02 to 09 sections (desktop + phone), 10 footer, 11 sticky phone bar.
