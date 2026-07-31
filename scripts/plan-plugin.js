// plugins/plan-plugin.js
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');

module.exports = function planPlugin(context, options) {
  return {
    name: 'upbound-plan-plugin',
    
    async loadContent() {
      const planData = {};
      const docsPath = path.join(context.siteDir, 'docs');

      if (fs.existsSync(docsPath)) {
        const docFiles = fs
          .readdirSync(docsPath, { recursive: true })
          .filter((item) => item.endsWith('.md') || item.endsWith('.mdx'));

        docFiles.forEach((relativePath) => {
          const itemPath = path.join(docsPath, relativePath);
          const content = fs.readFileSync(itemPath, 'utf8');
          const { data: frontmatter } = matter(content);

          if (frontmatter.plan) {
            const docId = relativePath.replace(/\.(md|mdx)$/, '');
            planData[docId] = {
              plan: frontmatter.plan,
              title: frontmatter.title,
              path: itemPath
            };
          }
        });
      }

      return { planData };
    },
    
    async contentLoaded({ content, actions }) {
      const { setGlobalData } = actions;
      setGlobalData(content);
    },
    
    getPathsToWatch() {
      return [path.join(context.siteDir, 'docs/**/*.{md,mdx}')];
    },
  };
};
