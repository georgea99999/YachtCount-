

## Plan: Add Box Renaming Feature

Currently, box names are hardcoded in `BOX_OPTIONS` and stored as plain strings on each stock item. There's no UI to rename a box.

### Approach

1. **Add a rename button to `SortableBoxHeader`** — Show a pencil/edit icon next to each box name. Clicking it opens an inline text input to type the new name.

2. **Create a `renameBox` function in `useInventory`** — This will:
   - Update all `stock_items` in the database where `box = oldName` to `box = newName`
   - Update the `custom_boxes` table if the old name was a custom box
   - Update `usage_history` entries (box column) for consistency
   - Update local state accordingly

3. **Also allow renaming in non-reorder mode** — Add an edit icon on the box header row (the collapsible section title) in `StockList.tsx` so users can rename boxes anytime, not just during reorder.

4. **Update box filter dropdown** — The `Select` dropdown in `StockList.tsx` and the box selector in `StockItem.tsx` edit mode will automatically reflect renamed boxes since they derive from the items' actual box values.

### Files to modify
- `src/components/inventory/SortableBoxHeader.tsx` — Add inline rename UI
- `src/components/inventory/StockList.tsx` — Add rename icon on box headers, pass rename handler
- `src/hooks/useInventory.ts` — Add `renameBox` function (batch update in DB)
- `src/pages/Index.tsx` — Wire through the rename handler

