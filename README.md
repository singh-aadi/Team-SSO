# Team-SSO

## Build Locally

```bash
$ cd frontend/
$ npm install --save-build vite
$ npm run build     # or directly run: vite build
```

This generates `dist/` folder in `frontend/` folder.

To actually launch site on localhost from `dist/` folder, run:

```bash
$ vite preview
```

## Development only

Run `npm run dev` (or equivalently `vite` command) to directly launch site without needing to build during development.
However build step is required for production.


