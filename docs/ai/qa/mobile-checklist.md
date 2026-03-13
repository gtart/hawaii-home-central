# Mobile QA Checklist

Test at viewport widths below 768px (iPhone SE 375px, iPhone 14 390px).

## Layout
- [ ] All pages render correctly below 768px
- [ ] No content hidden behind bottom nav (pb-24 clearance)
- [ ] No horizontal overflow or scroll
- [ ] Text readable without zooming (min 14px body text)
- [ ] Cards/containers use full width with appropriate padding

## Interactions
- [ ] Bottom sheets used for modals/pickers (not centered dialogs)
- [ ] Touch targets >= 44x44 on all interactive elements
- [ ] Swipe/scroll behaves naturally (no scroll traps)
- [ ] Form inputs don't get hidden behind keyboard
- [ ] Status badges/pills are tappable and responsive

## Tool-Specific
- [ ] **Selections list**: card view (not table), mobile filter sheet works
- [ ] **Selection detail**: compact header, options visible without excessive scrolling
- [ ] **Option detail**: single column layout, safe-area clearance
- [ ] **Fix List**: card view, add item form works
- [ ] **Mood Boards**: grid adapts to fewer columns
- [ ] **Project Summary**: all sections accessible, comment sheet works
- [ ] **Change detail**: single column, all fields editable, attachments work
- [ ] **Collection picker**: cards stack single-column

## Common Mobile Bugs
- [ ] No elements with `hidden md:block` that should also render on mobile
- [ ] InlineEdit components don't break layout when editing
- [ ] Dropdown menus (custom div-based) don't overflow viewport
- [ ] Loading spinners centered and visible
- [ ] Empty states display correctly (not awkwardly spaced)
