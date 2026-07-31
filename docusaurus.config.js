// @ts-check
import { themes as prismThemes } from "prism-react-renderer";

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: "Upbound Documentation",
    tagline: "Guide your internal cloud platform journey",
    favicon: "img/icons/favicon.ico",
    trailingSlash: true,
    url: "https://docs.upbound.io",
    baseUrl: "/",
    organizationName: "upbound",
    projectName: "docs",
    onBrokenLinks: "warn",
    scripts: [
        {
            src: "https://cdn-cookieyes.com/client_data/401fea7900d8d7b84b9e7b40/script.js",
            id: "cookieyes",
        },
        {
            src: "/js/inline-docs.js",
            id: "inline-docs",
            defer: true,
        },
    ],
    customFields: {
        apiUrl: process.env.UPBOUND_API_URL || "https://api.upbound.io",
        baseDomain: process.env.UPBOUND_BASE_DOMAIN || "upbound.io",
        launchDarklyClientId: process.env.LAUNCHDARKLY_CLIENT_ID || "",
    },
    webpack: {
        jsLoader: (isServer) => ({
            loader: require.resolve("esbuild-loader"),
            options: {
                loader: "tsx",
                target: isServer ? "node12" : "es2017",
            },
        }),
    },
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },
    markdown: {
        mermaid: true,
        hooks: {
            onBrokenMarkdownLinks: "warn",
        },
    },
    themes: ["@docusaurus/theme-mermaid"],
    presets: [
        [
            "classic",
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: false,
                blog: false,
                theme: {
                    customCss: "./src/css/custom.css",
                },
                gtag: {
                    trackingID: "G-J3WTQYFSSY",
                    anonymizeIP: true,
                },
                sitemap: {
                    changefreq: "weekly",
                    priority: 0.5,
                    ignorePatterns: ["/search/**", "/tags/**"],
                    filename: "sitemap.xml",
                },
            }),
        ],
    ],
    plugins: [
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "docs",
                path: "docs",
                routeBasePath: "/",
                sidebarPath: require.resolve("./src/sidebars/main.js"),
                remarkPlugins: [require("./scripts/manifest-embed-plugin")],
            },
        ],
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "self-hosted-spaces",
                path: "self-hosted-spaces-docs",
                routeBasePath: "/self-hosted-spaces",
                sidebarPath: require.resolve("./src/sidebars/self-hosted-spaces.js"),
                includeCurrentVersion: true,
                lastVersion: "current",
                versions: {
                    current: {
                        label: "1.17",
                    },
                },
            },
        ],
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "cloud-spaces",
                path: "cloud-spaces-docs",
                routeBasePath: "/cloud-spaces",
                sidebarPath: require.resolve("./src/sidebars/cloud-spaces.js"),
            },
        ],
        [
            "@docusaurus/plugin-content-docs",
            {
                id: "hub",
                path: "hub-docs",
                routeBasePath: "/hub",
                sidebarPath: require.resolve("./src/sidebars/hub.js"),
                remarkPlugins: [require("./scripts/manifest-embed-plugin")],
                includeCurrentVersion: true,
                lastVersion: "current",
                versions: {
                    current: {
                        label: "1.0",
                    },
                },
            },
        ],
                "./scripts/plan-plugin.js",
        function (context, options) {
            return {
                name: "custom-webpack-config",
                configureWebpack(config, isServer) {
                    const webpack = require("webpack");
                    const path = require("path");
                    return {
                        plugins: [
                            new webpack.ProvidePlugin({
                                process: "process/browser.js",
                                React: "react",
                            }),
                        ],
                        resolve: {
                            fallback: {
                                process: require.resolve("process/browser.js"),
                            },
                            fullySpecified: false,
                            extensions: [
                                ".js",
                                ".jsx",
                                ".ts",
                                ".tsx",
                                ".json",
                                ".css",
                            ],
                            mainFiles: ["index"],
                        },
                        resolveLoader: {
                            modules: [
                                path.resolve(__dirname, "node_modules"),
                                "node_modules",
                            ],
                        },
                    };
                },
            };
        },
    ],
    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
        //   announcementBar: {
        //       id: "my_custom_banner",
        //       content:
        //          '<a href="https://www.upbound.io/events/kubecon-cloudnativecon-emea-amsterdam-2026" target="_blank" rel="noopener noreferrer">🎉 Visit us at KubeCon Amsterdam!</a>',
        //      backgroundColor: "#9b5efc",
        //        textColor: "#fff",
        //        isCloseable: true,
        //    },
            head: [
                [
                    "meta",
                    {
                        property: "og:image",
                        content: "img/up-logo.png",
                    },
                ],
            ],
            image: "img/up-logo.png",
            navbar: {
                title: "",
                logo: {
                    alt: "Upbound Logo",
                    src: "img/logos/upbound-docs.svg",
                    srcDark: "img/logos/up-docs-white.svg",
                },
                items: [
                    {
                        label: "Get Started",
                        position: "left",
                        to: "/",
                    },
                    {
                        type: "dropdown",
                        label: "Guides",
                        position: "left",
                        to: "/guides/",
                        items: [
                            {
                                label: "Intelligent Control Planes",
                                to: "/guides/intelligent-control-planes/",
                            },
                            {
                                label: "Platform Solutions",
                                to: "/guides/solutions/get-started/",
                            },
                            {
                                label: "Use Cases",
                                to: "/guides/usecases/",
                            },
                        ],
                    },
                    {
                        type: "dropdown",
                        label: "Manuals",
                        to: "/manuals/",
                        position: "left",
                        items: [
                            {
                                label: "UXP (Upbound Crossplane)",
                                to: "/manuals/uxp/overview/",
                            },
                            {
                                label: "Cloud Spaces",
                                to: "/cloud-spaces/overview/",
                            },
                            {
                                label: "Self-Hosted Spaces",
                                to: "/self-hosted-spaces/overview/",
                            },
                            {
                                label: "Hub",
                                to: "/hub/",
                            },
                            {
                                label: "Console",
                                to: "/manuals/console/upbound-console/",
                            },
                            {
                                label: "Platform",
                                to: "/manuals/platform/overview/",
                            },
                            {
                                label: "CLI",
                                to: "/manuals/cli/overview/",
                            },
                            {
                                label: "Packages",
                                to: "/manuals/packages/overview/",
                            },
                            {
                                label: "Marketplace",
                                to: "/manuals/marketplace/overview/",
                            },
                        ],
                    },
                    {
                        label: "Reference",
                        position: "left",
                        to: "/reference/",
                    },
                    {
                        type: "search",
                        position: "right",
                    },
                ],
            },
            algolia: {
                appId: "4OZX85VEXQ",
                apiKey: process.env.ALGOLIA_API_KEY || "9f96702edcf79d7097bedfce2813d49e",
                indexName: "upbound",
                contextualSearch: false,
                searchPagePath: "search",
                ...(process.env.ALGOLIA_ASK_AI_KEY && { askAi: process.env.ALGOLIA_ASK_AI_KEY }),
                searchParameters: {},
                placeholder: "Search the docs or Ask AI",
                translations: {
                    button: {
                        buttonText: "Search the docs or Ask AI",
                        buttonAriaLabel: "Search the docs or Ask AI",
                    },
                },
            },
            footer: {
                style: "dark",
                copyright: `
    <div class="footer-content">
      <p class="footer-message">
        Join the community and start building your platform with Upbound Crossplane
      </p>
      <div class="footer-links">
        <a href="https://slack.crossplane.io">Community Slack</a>
        <a href="https://github.com/upbound">GitHub</a>
        <a href="https://marketplace.upbound.io">Marketplace</a>
        <a href="https://www.upbound.io/pricing">Pricing</a>
      </div>
      <p class="footer-copyright">
        Copyright © ${new Date().getFullYear()} Upbound. All rights reserved.
      </p>
    </div>
  `,
            },
            prism: {
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
                additionalLanguages: ["bash", "yaml", "json", "go", "python", "http"],
            },
            colorMode: {
                defaultMode: "light",
                disableSwitch: false,
                respectPrefersColorScheme: false,
            },
            docs: {
                sidebar: {
                    hideable: true,
                },
            },
        }),
};

export default config;
