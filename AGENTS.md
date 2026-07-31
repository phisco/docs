# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Run Commands
- Install dependencies: `npm install`
- Start local docs server: `npm start`
- Build documentation: `npm run build`
- Serve built documentation: `npm run serve`
- Clear Docusaurus cache: `npm run clear`
- Deploy documentation: `npm run deploy`
- Generate translations: `npm run write-translations`
- Generate heading IDs: `npm run write-heading-ids`
- Check Vale linting: Clone and run Vale from [upbound/vale](https://github.com/upbound/vale)

## Style Guidelines
- **Markdown**: Follow standard markdown syntax for docs
- **Links**: Use Docusaurus ref syntax for internal links: `[link text](./path/to/file.md)`
- **Images**: Place in `/static/images/`, reference with `/images/path/to/image.png`
- **Vale Rules**: Follow Google, Microsoft, and Upbound style guides enforced by Vale
- **Content Structure**: Keep front matter with `title` and `weight` at top of each file
- **Shortcodes**: Use `:::tip`, `:::warning`, `:::info` for callouts and `<Tabs>` for tabbed content

## Repository Structure
- `docs/`: Markdown files for documentation pages
- `static/images/`: All image files
- `src/`: React components and custom styling
- `src/sidebars/main.js`: Navigation structure
- `docusaurus.config.js`: Site configuration
- `package.json`: Dependencies and build scripts
- `content/`: Content templates and utilities
- `scripts/`: Build and processing scripts
- `utils/`: Utility functions and helpers
- `templates/`: Documentation templates

## Development Notes
- This is a Docusaurus site, not Hugo
- Requires Node.js 18.x and npm 9.x
- Use `npm start` for local development with hot reloading
- Site uses React components and MDX for enhanced functionality