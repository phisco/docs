<!-- vale off -->
# Contributing to Upbound Documentation

This guide covers how to contribute to the Upbound documentation, from quick fixes to major feature guides.

## Getting Started

1. **Clone** this repository
2. **Set up your development environment** with `make dev`
3. **Optional: Configure VSCode** for the best editing experience (see [VSCode Setup](#vscode-setup))

## Types of Contributions

### Quick Fixes (Typos, Small Updates)
**What**: Typos, broken links, minor clarifications, small corrections

**Process**:
- **Create a GitHub issue** or **Linear ticket** to track the change
- **OR** submit a **direct PR** for obvious fixes (broken links, spelling errors)
- Use `make lint` to check your changes before submitting

### Major Contributions (New Guides, Feature Documentation)
**What**: New feature guides, comprehensive tutorials, significant content updates

**Process**:
1. **Create a Linear issue first** to discuss scope and approach
2. **Create PR** once the content is ready
3. **Request approval** from maintainers to merge

## Development Workflow

### Local Development
```bash
# First time setup
make dev

# Start development server
make start

# Check your writing (Vale linting)
make lint

# Lint a specific file
make vale-file FILE=docs/concepts/providers.md

# Build to verify everything works
make build
```

### Writing Quality Standards

**Vale Integration**: We use Vale for automated writing quality checks.

- **Errors**: Will block PR approval (spelling, grammar, critical style issues)
- **Warnings & Suggestions**: Shown in PR but won't block (helpful for learning)
- **Real-time feedback**: Available in VSCode with recommended extensions

All PRs require maintainer approval to merge, regardless of Vale status.

## Updating CRDs

CRD reference pages (`docs/reference/apis/*`) render live from raw CRD YAML
files committed under `static/crds/<product>/`. There's no generation step —
Docusaurus serves `static/` files as-is, and the `CrdDocViewer` component
fetches the YAML client-side by URL:

```mdx
<CrdDocViewer crdUrl="/crds/testing/meta.dev.upbound.io_compositiontests.yaml" />
```

To add or update a CRD:

1. Copy the CRD's YAML file from its source repo (UXP, Crossplane, Spaces,
   etc.) into the matching `static/crds/<product>/` directory.
2. Reference it from the relevant page with `<CrdDocViewer crdUrl="/crds/..." />`.
3. Commit the YAML file alongside your doc changes in the same PR.

## VSCode Setup (Recommended)

For the best documentation editing experience, install these extensions:

### Essential Extensions
Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "ChrisChinchilla.vale-vscode",
    "DavidAnson.vscode-markdownlint", 
    "unifiedjs.vscode-mdx",
    "TomasDahlqvist.markdown-admonitions"
  ]
}
```

### Configuration
Add to `.vscode/settings.json`:
```json
{
  // Vale - uses existing utils/vale/.vale.ini configuration
  "vale.valeCLI.config": "${workspaceFolder}/utils/vale/.vale.ini",
  
  // 80-character line wrapping for markdown files
  "[markdown]": {
    "editor.wordWrapColumn": 80,
    "editor.rulers": [80]
  },
  "[mdx]": {
    "editor.wordWrapColumn": 80,
    "editor.rulers": [80]
  }
}
```

**Benefits**:
- Real-time Vale feedback as you type
- Proper syntax highlighting for MDX files
- Preview support for Docusaurus admonitions (`:::tip`, `:::warning`)
- Automatic line wrapping at 80 characters

## Style Guide Summary

Follow the [complete style guide](README.md#style-guide) with these key points:

**Writing**:
- Use active voice, present tense
- Sentence-case headings
- 80-character line wrapping
- No Oxford commas
- Contractions encouraged ("don't" vs "do not")

**Code & Technical**:
- Kubernetes Kinds: `UpperCamelCase`
- Object names: `kebab-case`
- Use fenced code blocks with language hints
- Place images in `static/img/` folder

**Forbidden Terms**:
- Avoid "easy", "simple", "obvious"
- No passive voice
- No Latin terms (i.e., e.g., etc.)
- No clichés

## PR Review Process

1. **Automated checks**: Vale linting runs on all PRs
   - Shows suggestions/warnings for learning
   - Only blocks on errors (spelling, critical issues)

2. **Required approval**: All PRs need maintainer approval regardless of automated checks

3. **Review focus**:
   - Content accuracy and completeness
   - Alignment with Upbound's voice and style
   - Technical correctness
   - User experience and clarity

## Getting help

- **Documentation questions**: Create a GitHub issue
- **Feature requests**: Create a Linear ticket
- **Technical issues**: Ask in the PR or create an issue
- **Style guide questions**: Refer to the [complete style guide](README.md#style-guide)

## Vale

Vale helps maintain consistent, high-quality writing across all documentation. It uses multiple style guides (Microsoft, Google, GitLab) plus Upbound-specific rules.

**Command line usage**:
```bash
make lint                    # Check all files
make vale-file FILE=docs/filename.md... # Check specific file
```

**VSCode integration**: Install the recommended extensions for real-time feedback while writing.

Vale feedback levels:
- **Suggestions**: Writing tips (informational)
- **Warnings**: Style recommendations (informational) 
- **Errors**: Critical issues (blocks PR)

Remember: Vale helps catch issues, but maintainer approval is always required for merge.

**Vale overrides**: Stop Vale from parsing a specific section with a specific rule.

```markdown

<!--vale Microsoft.Adverbs = NO -->

Create a support ticket and our team will reach out to you promptly.

<!-- vale Microsoft.Adverbs = YES -->

```

This overrides the warning for the adverb "promptly" in a single sentence.

<!-- vale on -->
