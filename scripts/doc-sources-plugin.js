// plugins/doc-sources-plugin.js
//
// Copies the markdown source of every published doc into build/raw/, keeping
// the repo-relative path. `metadata.source` is always `@site/<repo path>`, so
// CopyPageMenu can build a fetchable URL by swapping the `@site/` prefix for
// `/raw/` with no route mapping.
//
// Agents get real markdown instead of scraped DOM text, and the "Open in
// ChatGPT / Claude / Cursor" links resolve on our own domain instead of a
// private GitHub repo.
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');

// Docs plugin instances read from `docs`, `<name>-docs`, and the generated
// `<name>_versioned_docs` trees. Matching by shape means a new product or
// version directory is picked up without touching this list.
const isDocsDir = (name) =>
  name === 'docs' || name.endsWith('-docs') || name.endsWith('_versioned_docs');

module.exports = function docSourcesPlugin(context) {
  return {
    name: 'upbound-doc-sources',

    async postBuild({ outDir }) {
      const sourceDirs = fs
        .readdirSync(context.siteDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && isDocsDir(entry.name))
        .map((entry) => entry.name);

      let copied = 0;
      let skipped = 0;

      sourceDirs.forEach((dir) => {
        const docFiles = fs
          .readdirSync(path.join(context.siteDir, dir), { recursive: true })
          .filter((item) => item.endsWith('.md') || item.endsWith('.mdx'));

        docFiles.forEach((relativePath) => {
          const from = path.join(context.siteDir, dir, relativePath);
          const raw = fs.readFileSync(from, 'utf8');

          // Docusaurus never builds drafts, so publishing their source would
          // expose pages that have no corresponding page on the site.
          if (matter(raw).data.draft === true) {
            skipped += 1;
            return;
          }

          const to = path.join(outDir, 'raw', dir, relativePath);
          fs.mkdirSync(path.dirname(to), { recursive: true });
          fs.copyFileSync(from, to);
          copied += 1;
        });
      });

      console.log(
        `[doc-sources] copied ${copied} markdown sources to raw/ (skipped ${skipped} draft)`
      );
    },
  };
};
