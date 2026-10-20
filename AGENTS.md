# Project rules
- Parse inventory CSV files with Papa Parse and validate all rows before saving through the existing inventory hook; this handles quoted fields without partial invalid imports.
- Keep inventory sorting in a shared pure utility used by the inventory view; this makes the default alphabetical order testable while preserving manual reorder mode.