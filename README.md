# Pi Explorer

A responsive **React + TypeScript + Tailwind CSS** website that finds exact digit sequences in the first **1,000,000 decimal digits of π**. Pi has infinitely many digits; this app makes no claim to search all of them.

The interface uses a charcoal and lime palette, DM Sans and DM Mono with Instrument Serif accents, a custom orbital π illustration, and responsive search and result components. Fonts are bundled locally. Vite builds a fully static site: a Web Worker downloads and verifies the one-million-digit dataset once, then performs exact searches locally without blocking the interface. No backend is required on GitHub Pages. The optional TypeScript Node server also offers a local search API.

## Run locally

Requires Node.js **22.18+** (native TypeScript support), npm, and Python 3.10+. No API keys or database are needed. Install the locked npm dependencies first.

```sh
cd /workspace/Pie
npm ci --cache /workspace/.npm-cache
npm run setup
npm run build
npm start
```

The server uses port 3000 by default. Set `PORT` and optionally `HOST` to change its address. Run `npm run dev` for Vite's React hot reloading and Node's backend watch mode; the app and optional API share the same port. Open the server in your browser when running locally. Rebuild with `npm run build` after frontend changes before running the production server.

`npm run setup` generates pi using Chudnovsky binary splitting with 40 guard digits, records a SHA-256 checksum, and reuses the dataset after checking its contents and checksum. Generated files live in ignored `data/`; preserve them to avoid recomputation. The build verifies and copies the dataset into `dist/`. The browser worker and optional server verify the checksum before searching. The generator is also tested against an independent Machin-formula calculation.

## Search behavior

- Submit 1–1,000 ASCII digits, including leading zeros. Spaces within a sequence, letters, signs, and decimal points are rejected.
- Position **1** is the first digit after the decimal point: the `1` in `3.14159…`. The integer `3` is excluded.
- Search counts all occurrences, including overlapping ones. The worker returns the first 100 matches with surrounding digits; the interface reveals them 10 at a time.
- No match means the sequence was absent from the available dataset. It does not establish absence from π.
- Search links use `?q=0000` and preserve the original digit string.

To generate a larger local dataset, run `python3 scripts/generate_pi.py --digits 2000000`, rebuild, and restart the server. The generator supports up to 10,000,000 digits; compute time and memory grow with size. `npm run setup` always restores the default one-million-digit dataset.

## Searching beyond the stored digits

Every search first scans the stored million digits and lists all matches. If there are none, a separate Web Worker calculates π further with the Chudnovsky series (binary splitting on native `BigInt`, `src/lib/piGenerator.ts`). It works in doubling rounds (2M, 4M, 8M, … digits) and scans only the digits new to each round, including the boundary between rounds (`src/lib/deepSearch.ts`). Each round's digits are discarded afterwards, and the search continues until the first appearance is found or the visitor stops it. Only the first appearance is reported for these searches.

A sequence of *n* digits usually first appears near position 10ⁿ. On a typical laptop, 2M digits take about 5 s, 4M about 13 s and 8M about 30 s, so seven-digit sequences usually take a minute or two. Eight or more digits can take much longer and may exhaust memory on small devices.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` installs locked dependencies, generates the dataset, runs the typecheck/build/tests, builds with the `/Pie/` base path, and deploys the static artifact. In repository **Settings → Pages**, select **GitHub Actions** as the source. Pushes to `main` deploy automatically; the workflow can also be run manually from Actions.

The intended public address is `https://souravpriyadarsi.github.io/Pie/`. This address is live only after Pages is enabled and the deployment succeeds.

To reproduce the Pages build locally:

```sh
PAGES_BASE_PATH=/Pie/ npm run build
```

Serve the contents of `dist/` under `/Pie/` on a static HTTP server. The React assets, fonts, worker, digit data, favicon, home link, and shared query URLs all respect that base path. Searches require no `/api/` requests.

## Validation

```sh
npm test
npm run typecheck
npm run check
curl --fail 'http://127.0.0.1:3000/api/search?q=14159'
```

The first result must have `position: 1`. `npm run check` builds and typechecks the app, then runs the test suite. Run a build before `npm test` so its HTTP tests can verify the production assets. Tests cover positions, leading zeros, overlapping results, API validation, asset paths, and independent pi generation. The interface has also been checked in Chromium on desktop and mobile, including query links, invalid input, no-match results, and connection failure recovery.

## Cloud tasks

Use the existing `/workspace/Pie` checkout; each task is already isolated, so no Git worktree is needed. The saved installation script installs locked dependencies, prepares the dataset, and runs the build and tests. The saved startup instructions restart the TypeScript server and verify a functional search. Keep ignored `node_modules/`, `dist/`, and `data/` for reuse. Running processes must be restarted after restoration. Deployment and publishing are separate actions.
