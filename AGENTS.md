# Project rules
- Parse inventory CSV files with Papa Parse and validate all rows before saving through the existing inventory hook; this handles quoted fields without partial invalid imports.
- Keep inventory sorting in a shared pure utility used by the inventory view; this makes the default alphabetical order testable while preserving manual reorder mode.
- Authenticate each crew username as a separate account and derive vessel access and actor attribution on the server; client-selected identities must never grant access or overwrite audit authors.
- Store inventory, To Do and Deck Order in vessel-scoped cloud tables, with subscriptions cleaned up on unmount; this keeps crew devices consistent without cross-vessel browser-cache leakage.
- Create crew accounts through the authenticated crew-access function with owner checks; synthetic login emails avoid requiring crew personal email addresses.
- Route crew rename, password reset and deactivation through server-validated vessel ownership; retain inactive memberships and enforce active access in RLS so existing tokens cannot bypass deactivation or erase audit history.
- Share name normalization and synthetic-email mapping between sign-in and the crew-access function; this keeps full-name logins consistent while preserving legacy crew accounts.