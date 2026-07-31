module.exports = {
  sidebar: [
    {
      type: "doc",
      id: "overview/index",
      label: "Overview",
    },
    {
      type: "category",
      label: "Concepts",
      items: ["concepts/architecture"],
    },
    {
      type: "category",
      label: "Products",
      items: [
        {
          type: "category",
          label: "Insights",
          link: { type: "doc", id: "products/insights/overview" },
          items: [
            {
              type: "category",
              link: { type: "doc", id: "products/insights/resource-exploration/overview" },
              label: "Resource Exploration",
              items: [
                "products/insights/resource-exploration/query",
                "products/insights/resource-exploration/filtering-resources",
              ],
            },
            {
              type: "category",
              label: "Lenses",
              link: { type: "doc", id: "products/insights/lenses/overview" },
              items: ["products/insights/lenses/console"],
            },
            "products/insights/packages",
            "products/insights/definitions",
            {
              type: "category",
              label: "Catalog",
              link: { type: "doc", id: "products/insights/catalog/overview" },
              customProps: { badge: "Preview" },
              items: [
                "products/insights/catalog/console",
                "products/insights/catalog/external-registry",
              ],
            },
            {
              type: "doc",
              id: "products/insights/metrics/overview",
              label: "Metrics",
              customProps: { badge: "Preview" },
            },
          ],
        },
      ],
    },
    {
      type: "category",
      label: "Deploy",
      items: [
        "howtos/prerequisites",
        "howtos/oidc-configuration",
        {
          type: "category",
          label: "Databases",
          link: { type: "doc", id: "howtos/databases/overview" },
          items: ["howtos/databases/aws-rds"],
        },
        "howtos/install",
        "howtos/connect-control-plane",
        "howtos/connect-space",
        "howtos/configure-kubectl",
      ],
    },
    {
      type: "category",
      label: "Production",
      link: { type: "doc", id: "howtos/production-overview" },
      items: [
        "howtos/sizing",
        "howtos/high-availability",
        "howtos/autoscaling",
        "howtos/rbac",
        "howtos/upgrades",
        "howtos/observability",
      ],
    },
    {
      type: "category",
      label: "Reference",
      link: { type: "doc", id: "reference/index" },
      items: [
        "reference/feature-flags",
        "reference/feature-releases",
        "reference/helm-values",
      ],
    },
  ],
};
