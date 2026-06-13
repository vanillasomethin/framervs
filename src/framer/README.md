# src/framer

This directory is where [unframer](https://github.com/remorses/unframer) writes
the React components it exports from the Framer project, plus `styles.css`
(Framer's global styles and fonts).

It starts empty on purpose. Run `npm run framer:export` (after the one-time
Framer setup in `UNFRAMER_SETUP.md`) to populate it. The generated files are
committed so the site can build without re-exporting on every deploy.
