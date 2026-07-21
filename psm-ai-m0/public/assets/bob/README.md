# BOB asset library

Verified runtime assets included in this package:

- `master/bob-primary.svg` — primary Bob rendering for every application state.
- `fallback/bob-fallback.svg` — the single fallback used only if the primary cannot load.
- `scenarios.json` — maps each application state to the verified primary asset and motion class.

The `animations`, `expressions`, and `audio` folders are reserved for future verified media. Nothing in the application probes them, so empty or future content cannot create 404 request chains.
