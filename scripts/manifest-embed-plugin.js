// Embeds the contents of a file under static/ into a fenced code block at
// build time, so long manifests/scripts live in their own file instead of
// bloating the markdown source. Usage:
//
//   ```yaml title="./example.yaml" manifest="/manifests/getstarted/example.yaml"
//   ```
//
// The fence body is ignored (and should be left empty) -- it's replaced with
// the referenced file's contents.
const fs = require("fs");
const path = require("path");

const EXT_TO_LANG = {
    yaml: "yaml",
    yml: "yaml",
    py: "python",
    k: "kcl",
    go: "go",
    sh: "shell",
    json: "json",
};

module.exports = function manifestEmbedPlugin() {
    return function transformer(tree) {
        visit(tree);
    };

    function visit(node) {
        if (node.type === "code" && node.meta) {
            const match = node.meta.match(/manifest="([^"]+)"/);
            if (match) {
                const manifestPath = path.join(process.cwd(), "static", match[1]);
                if (!fs.existsSync(manifestPath)) {
                    throw new Error(
                        `manifest-embed-plugin: file not found: ${manifestPath} (referenced as manifest="${match[1]}")`
                    );
                }
                node.value = fs.readFileSync(manifestPath, "utf8").replace(/\n$/, "");
                if (!node.lang) {
                    const ext = path.extname(manifestPath).slice(1);
                    node.lang = EXT_TO_LANG[ext] || ext;
                }
            }
        }
        if (node.children) {
            node.children.forEach(visit);
        }
    }
};
