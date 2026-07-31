# Upbound Documentation

This repo contains the Upbound documentation built with Docusaurus. 

* [Local Development](#local-development)
* [Self-Hosted Spaces versioning](#self-hosted-spaces-versioning)
* [Style Guide](#style-guide)
* [Code style guide](#code-style-guide)
* [Markdown](#markdown)
* [Admonitions](#admonitions)

## Local development

To contribute to this effort, clone this repo and use the `Makefile` to build
your local docs environment. The `Makefile` handles both the
documentation build process and Vale-based prose linting.

```bash
# First time setup
make dev

# Subsequent development sessions
make start

# Check your writing
make lint

# Build to ensure everything works
make build

# Lint a single file
make vale-file FILE=docs/concepts/providers.md

# Get a summary of all issues
make lint-summary

# Clean everything and rebuild
make clean
make build

# Check your vale configuration

make check-vale-config
```

### Available commands

**Docs Build Commands**

| Command | Description |
|---------|-------------|
| `make install` | Install npm dependencies |
| `make build` | Build the documentation site |
| `make start` | Start local development server with hot reload |
| `make serve` | Serve the built documentation |
| `make dev` | Install dependencies and start development server |
| `make ci-build` | Full build process for CI/CD |

**Vale Linter Commands** 

Vale is a prose linter that helps maintain consistent writing style and catches
common errors.

| Command | Description |
|---------|-------------|
| `make install-vale` | Download and install Vale binary locally |
| `make vale` | Run Vale linting on all markdown files |
| `make vale-docs` | Run Vale linting on docs directory only |
| `make vale-file FILE=path/to/file.md` | Lint a specific file |
| `make vale-summary` | Run Vale with summary output |
| `make vale-json` | Run Vale with JSON output for CI integration |
| `make lint` | Alias for `make vale` |
| `make lint-summary` | Alias for `make vale-summary` |
| `make lint-file` | Alias for `make vale-file` |
| `make ci-lint` | Run linting optimized for CI/CD pipelines |

**Utility Commands**

| Command | Description |
|---------|-------------|
| `make clean` | Remove build artifacts and installed binaries |
| `make check-vale-config` | Verify Vale configuration and styles |
| `make version` | Show versions of all tools |
| `make help` | Display all available commands |


## Self-Hosted Spaces versioning

The Self-Hosted Spaces docs are the only versioned plugin in this repo. UXP,
Cloud Spaces, and the rest are unversioned.

### Layout

- `self-hosted-spaces-docs/` — the live latest version. Served at
  `/self-hosted-spaces/`.
- `self-hosted-spaces_versioned_docs/version-X.Y/` — frozen snapshots of past
  versions. Served at `/self-hosted-spaces/X.Y/`.
- `self-hosted-spaces_versioned_sidebars/version-X.Y-sidebars.json` — sidebar
  config for each frozen version.
- `self-hosted-spaces_versions.json` — the list of frozen versions, newest
  first. Does **not** include the live latest.

The label for the live latest is set in two places (keep them in sync):

- `versions.current.label` in `docusaurus.config.js`
- `LATEST_VERSION` in `src/theme/DocSidebar/Desktop/Content/index.js`

### Patching docs

- **Live latest** — edit files in `self-hosted-spaces-docs/`. Changes go live at
  `/self-hosted-spaces/...` on the next deploy.
- **An older version** — edit files in
  `self-hosted-spaces_versioned_docs/version-X.Y/`. Older versions don't
  inherit edits from the live latest. If a fix applies to multiple versions,
  apply it to each tree.

### Cutting a new version

When shipping a new version, you snapshot the *current* state under the label
it currently represents, then bump the label for the next cycle. For example,
shipping 1.17 when the live latest is labeled 1.16:

1. Make sure `self-hosted-spaces-docs/` reflects the final state of 1.16.
2. Snapshot current as 1.16:

   ```bash
   npm run docusaurus -- docs:version:self-hosted-spaces 1.16
   ```

   This copies `self-hosted-spaces-docs/` to
   `self-hosted-spaces_versioned_docs/version-1.16/`, generates
   `self-hosted-spaces_versioned_sidebars/version-1.16-sidebars.json` from the
   current sidebar, and prepends `"1.16"` to `self-hosted-spaces_versions.json`.

3. Bump the live-latest label in both places:

   - `versions.current.label` in `docusaurus.config.js` → `"1.17"`
   - `LATEST_VERSION` in `src/theme/DocSidebar/Desktop/Content/index.js` →
     `'1.17'`

4. Apply 1.17 content changes to `self-hosted-spaces-docs/`.
5. Run `npm run clear && npm start` to verify the dropdown shows
   `1.17 (Latest)` and `/self-hosted-spaces/1.16/` resolves to the new
   snapshot.
6. Commit and open a PR.

### Dropping an old version

To stop publishing (for example) 1.13:

1. Delete `self-hosted-spaces_versioned_docs/version-1.13/`.
2. Delete `self-hosted-spaces_versioned_sidebars/version-1.13-sidebars.json`.
3. Remove `"1.13"` from `self-hosted-spaces_versions.json`.

## Style guide

**TL;DR**

- Avoid [passive voice](https://www.grammarly.com/blog/passive-voice/)
- Use [sentence-case headings](https://apastyle.apa.org/style-grammar-guidelines/capitalization/sentence-case)
- Use [present tense](https://www.grammarly.com/blog/simple-present/) and avoid will
- Don't use [cliches](https://www.topcreativewritingcourses.com/blog/common-cliches-in-writing-and-how-to-avoid-them)
- Don't use "easy", "simple", etc.


### **1. General Writing Guidelines**

- **Avoid [passive voice](https://www.grammarly.com/blog/passive-voice/).**
    
    Active voice writing is stronger and direct. It also simplifies document translations.
    
- **Use present tense and avoid "will."**
    
    Documentation covers actions happening now and the results in real time.
    
- **Avoid gerund headings (-ing words).**
    
    Gerunds make headings less direct.
    
- **Limit sentences to 25 words or fewer.**
    
    Longer sentences are harder to read. Shorter sentences improve search engine optimization (SEO).
    

---

### **2. Formatting and Structure**

- **Use sentence-case headings.**
    
    Sentence case creates more casual and approachable writing.
    
- **Wrap lines at 80 characters.**
    
    Line wrapping improves review feedback.
    
- **Spell out the first use of an acronym unless it's common to new Crossplane users.**
    
    When in doubt, spell it out. Avoid assuming the reader already knows the background.
    
- **Be descriptive in link text.**
    
    Avoid "click here" or "read more." Descriptive link text improves accessibility for screen readers.
    
- **Order brand names alphabetically (e.g., AWS, Azure, GCP).**
    
    This removes the appearance of preference.
    

---

### **3. Grammar and Style**

- **Spell out numbers less than 10, except for percentages, time, and versions.**
    
    Numbers in sentences are harder to read.
    
- **Capitalize "Crossplane" and "Kubernetes."**
    
    These are proper nouns. Don't use abbreviations like "k8s."
    
- **Use contractions (e.g., "don't" instead of "do not").**
    
    Contractions improve readability and clarity.
    
- **Don't use Latin terms (e.g., i.e., etc.).**
    
    These are harder for non-Latin language speakers to understand.
    
- **Avoid cliches.**
    
    Cliches sound unprofessional and aren't internationally inclusive.
    
- **Avoid terms like "easy," "simple," or "obvious."**
    
    These terms can come across as condescending to the reader.
    
- **No Oxford commas.**
    
    Do not place a comma before "and" or "or."
    

---

### **4. Spelling and Localization**

- **Use U.S. English spelling and grammar.**
Ensure consistency across all documentation.


## Code Style Guide


### Italics

- Use *italics* to introduce or draw attention to a term.
- Use *italics* on the same term sparingly to avoid overuse.

---

### Inline Code Styles

- Use inline code styles (single backticks, ```) for files, directories, or paths.
- Example: ``/path/to/directory``
- Use the `{{< hover >}}` shortcode to relate command explanations to larger examples.

---

### Placeholders

- Use angle brackets (`< >`) for placeholders with short, descriptive names.
- Use underscores (`_`) between words to simplify selections.

#### **Example: AWS Credentials**

```
[default]
aws_access_key_id = <aws_access_key>
aws_secret_access_key = <aws_secret_key>
```
---

### Styling Kubernetes Objects

#### **Kinds**

- Kinds should use **upper camel case**: capitalize each word without separators.
- Example:
    
    ```yaml
    kind: MyComputeResource
    spec:
      group: test.example.org
      names:
        kind: MyComputeResource
    
    ```
    
    The words "My," "Compute," and "Resource" are capitalized with no spaces or dashes.
    

---

#### Names

- Object names should use **snake case**: all lowercase with dashes (-) between words.
- Example:
    
    ```yaml
    apiVersion: test.example.org/v1alpha1
    kind: MyComputeResource
    metadata:
      name: my-resource
    
    ```
    
    The name `my-resource` uses all lowercase, with a dash separating "my" and "resource."
    

---

### Inline Kubernetes Objects

- Kubernetes objects mentioned inline don't require special styling unless you want to draw specific attention to them.

---

### Use fenced code blocks

Fenced code blocks with language hints allow for language highlighting.

**Example:**

````
```yaml
apiVersion: s3.aws.m.upbound.io/v1beta1
kind: Bucket
metadata:
  namespace: default
  name: crossplane-bucket-example
spec:
  forProvider:
    region: us-east-2
```
````

---

### Dynamic line highlighting

Dynamic highlighting only highlights a specific line when a read hovers over a specific word outside of the code block.
This highlighting style is useful to draw attention to a line of code when explaining a command or argument. 

**Example:**

First, create the hover labels:

```html
Create a <Hover label="pc-upbound-auth" line="2">ProviderConfig</Hover> to set
the provider authentication method to <Hover label="pc-upbound-auth"
line="9">Upbound</Hover>.
```

Next, wrap the code block in a `<div id>` that matches the hover label:

````html
<div id="pc-upbound-auth">

```yaml 
apiVersion: azure.m.upbound.io/v1beta1
kind: ProviderConfig
metadata:
  name: default
spec:
  credentials:
    source: Upbound
  clientID: <client ID>
  tenantID: <tenant ID>
  subscriptionID: <subscription ID>
```

</div>
````

---

### Copy lines

Specify which lines of the code block to copy:

**Example:**

````shell
```shell {copy-lines=1}
cat examples/xapp/example.yaml
apiVersion: app.uppound.io/v1alpha1
kind: XApp
metadata:
  name: example
```
````
---

### Editable fields

Highlight areas where users can input their own information.

**Example:**

```jsx
<EditCode language="shell">
{`
up login --organization=$@YOUR_UPBOUND_ORG$@
`}
</EditCode>
```

## Markdown

### Images

Store images in the `static/img` folder and referenced as a relative link from
the project root.

**Example:**

```markdown
![image][image]

// Bottom of page
[image]: img/image.png
```
---

### Links

Docusaurus processes URL paths and file paths. For new links use reference-style
formatting.

**Example:**

```markdown
This is a [link][link]

// Bottom of page

[link]: https://www.website.com
```

For internal links, use absolute paths relative to the content root of `docs`.

**Example:**

```markdown
This is a [page link][page-link]

// Bottom of page

[page-link]: operate/page-link
```

---

### Tables

No special tags for tables. Just format as a Markdown table:

```markdown
| Short flag | Long flag | Description |
| --- | --- | --- |
| `-h` | `--help` | Show context-sensitive help. |
| | `--pretty` | Pretty print output. |
| `-q` | `--quiet` | Suppress all output. |
```

---

### Hide details

Docusaurus allows you to hide details in an accordian component readers can
toggle. Should be used sparingly as information can literally hide here:

**Example:**

````html
<details>
  <summary>Toggle me!</summary>

  This is the detailed content

  ```js
  console.log("Markdown features including the code block are available");
  ```

  You can use Markdown here including **bold** and _italic_ text, and [inline link](https://docusaurus.io)
  
  <details>
    <summary>Nested toggle! Some surprise inside...</summary>
  </details>
</details>
````
---

### Tabs

#### Standard tabs

Docusaurus formats tabs with `<Tabs>` and `<TabItem>` tags: 

**Example:** 

````jsx
<Tabs>

<TabItem value="Up CLI" label="Up CLI">

```bash
up space init --token-file="${SPACES_TOKEN_PATH}" "v${SPACES_VERSION}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd"
```

</TabItem>

<TabItem value="Helm" label="Helm">

```bash
helm -n upbound-system upgrade --install spaces \
  oci://xpkg.upbound.io/spaces-artifacts/spaces \
  --version "${SPACES_VERSION}" \
  --set "ingress.host=${SPACES_ROUTER_HOST}" \
  --set "account=${UPBOUND_ACCOUNT}" \
  --set "features.alpha.argocdPlugin.enabled=true" \
  --set "features.alpha.argocdPlugin.useUIDFormatForCTPSecrets=true" \
  --set "features.alpha.argocdPlugin.target.secretNamespace=argocd" \
  --wait
```

</TabItem>

</Tabs>
````
---

#### Synced tabs

Docusaurus `<Tabs>` component allows you to create tabbed content choices that persist
with `groupId`.

**Example:**

````jsx
<Tabs groupId="cloud-provider">
<TabItem value="aws" label="AWS">

```shell
git clone https://github.com/upbound/uppound-project-aws && cd uppound-project-aws
```

</TabItem>
<TabItem value="azure" label="Azure">

```shell
git clone https://github.com/upbound/uppound-project-azure && cd uppound-project-azure
```

</TabItem>
<TabItem value="gcp" label="GCP">

```shell
git clone https://github.com/upbound/uppound-project-gcp && cd uppound-project-gcp
```

</TabItem>
</Tabs>
````
---

## Admonitions

Docusaurus uses special admonitions with the following options:

```markdown
:::note

Notes are useful for calling out optional information.

:::
```

```markdown
:::tip

Use tips to provide context or a best practice.

:::
```

```markdown
:::warning

Warning hints are for drawing extra attention to something.

:::
```

```markdown
:::danger

Alert users of things that may cause outages, lose data or
are irreversible changes.

:::
```

For more information on this project, visit the [Notion page](https://www.notion.so/upbound/Operation-Dino-mite-Docs-1e453507d1f780bfa92fce8ca03c132b?pvs=4)
