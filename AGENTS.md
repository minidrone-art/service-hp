# Project Guidance

## User Preferences

- Bahasa antarmuka: Indonesia
- Fokus pada alur service HP: intake perangkat sampai pengambilan

## Verified Commands

- **typecheck**: `pnpm typecheck`
- **fix**: `pnpm fix`
- **build**: `pnpm build`

## Learnings

- AccessControl.isAdmin traps 'User is not registered' for an unregistered caller; a guard that must deny (not trap) reads accessControlState.userRoles.get(caller) directly and treats null as non-admin.
- Two mixins included into the same actor cannot both declare a private helper with the same name (M0051 duplicate definition); give each a distinct name.
- Candid IDL.Text is non-optional: never pass null to a Text argument; use "" and let the backend treat empty as no-filter.
- When a backend param changes from ?Text to Text, every frontend caller must switch null to ""; the generated binding keeps the non-optional type and Candid rejects null at encode time.
- React Query disabled queries report isLoading=false, so an auth gate keyed on isLoading can flash the wrong state while the actor initializes; derive loading from data === undefined.
- The sonner Toaster must be mounted once in the app shell for toast.success/toast.error calls in pages to render.
- The /tiket route declares validateSearch requiring { q, status }, so every Link/navigate to /tiket must pass that full search object.
- Tailwind 3 has no size-4.5 utility; fractional spacing like 4.5 silently produces no CSS.
- check-limit=1 means at most one pending migration may exist; fold further stable-state changes into the existing pending file.
- Under Enhanced Migration every stable field the migration's NewActor produces must be declared in the actor body with a type only (no initializer).
