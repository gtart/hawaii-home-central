# Desktop QA Checklist

Test at viewport widths 1024px and above.

## Layout
- [ ] Content has max-width constraint (max-w-4xl or max-w-6xl -- no ultra-wide drift)
- [ ] Multi-column layouts render correctly (sidebar + content, grids)
- [ ] Sticky sidebars (comments) don't overflow viewport or overlap footer
- [ ] Tables have reasonable column widths and don't collapse
- [ ] Appropriate whitespace between sections

## Interactions
- [ ] Hover states on all clickable elements (buttons, links, cards, status badges)
- [ ] Focus-visible rings for keyboard navigation
- [ ] Dropdowns are custom div-based (not native `<select>`) with bg-[#1a1a1a]
- [ ] Modals/dialogs center correctly and can be dismissed with Escape
- [ ] Inline editing activates on click and saves on blur/Enter

## Tool-Specific
- [ ] **Selections list**: table view with sort/group/filter toolbar
- [ ] **Selection detail**: comment sidebar (sticky right rail, ~360px)
- [ ] **Option detail**: 2-column layout (content + comments)
- [ ] **Fix List**: table view with inline editing
- [ ] **Project Summary**: all sections with proper spacing, comment sidebar
- [ ] **Change detail**: content area + comment sidebar, all fields editable
- [ ] **Collection picker**: multi-column card grid

## Common Desktop Bugs
- [ ] No elements with `md:hidden` that should also render on desktop
- [ ] Comment sidebar doesn't push content off-screen on narrow desktop (1024px)
- [ ] Empty states aren't awkwardly centered in wide containers
- [ ] Activity panel toggles correctly
- [ ] InstanceSwitcher dropdown doesn't get clipped
