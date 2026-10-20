# Admin-led vessel and crew access

- The first person setting up a vessel becomes its admin, enters the boat name, their full name and a shared vessel password.
- The admin can add crew from the Crew screen using full names; each added person signs in with their name and that same vessel password.
- Preserve existing crew-code logins, shared inventory and named activity history.
- Label the admin clearly and verify full-name sign-in mapping and the setup screen.

## Technical details
- Use one shared name-normalization helper in sign-in and the crew-account service, accepting spaces and international names.
- Keep existing server-enforced owner permissions as the admin authority; do not add client-side permission logic.
- No new profile fields or database tables are needed.