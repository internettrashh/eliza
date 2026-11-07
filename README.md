Evidence for the elizaOS/eliza PR "fix(maps): send a search limit that Eliza Cloud accepts from the Maps view" (branch fix/maps-view-search-limit). Not part of the PR diff.

before/: view bundle built from develop 43e3b05d97. after/: view bundle rebuilt with the fix.
Each folder: desktop (1440x900) and mobile (390x844) full-page screenshots, MP4 recordings, the browser console and network log, and the vitest output.
capture.mjs: the Playwright script that produced the captures (headless Chromium against `bun run dev -- --cloud-target production`).
