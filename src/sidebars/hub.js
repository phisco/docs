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
            {
              type: "category",
              label: "Agent skills",
              link: { type: "doc", id: "products/insights/agent-skills/overview" },
              items: ["products/insights/agent-skills/query-with-an-agent"],
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
        "howtos/upgrades",
        "howtos/observability",
      ],
    },
    {
      type: "category",
      label: "Identity and Access Management (IAM)",
      link: { type: "doc", id: "iam/overview" },
      items: [
        {
          type: "category",
          label: "Identity",
          link: { type: "doc", id: "iam/identity/overview" },
          items: [
            // Mirrors the reading order of the overview: configure a provider,
            // log in, verify who Hub thinks you are, then sync a directory.
            "iam/identity/identityprovider",
            "iam/identity/multiple-providers",
            "iam/identity/cli-agent-login",
            "iam/identity/workload-identities",
            "iam/identity/verifying-your-identity",
            "iam/identity/directory-sync",
            {
              // Worked IdentityProvider examples, alphabetical by product
              // name. Reference rather than reading order, so they sit last
              // in a category of their own.
              type: "category",
              label: "Sample Identity Providers",
              items: [
                "iam/identity/amazon-cognito",
                "iam/identity/google-workspace",
                "iam/identity/keycloak",
                "iam/identity/entra-id",
                "iam/identity/okta",
              ],
            },
          ],
        },
        {
          type: "category",
          label: "Access Management",
          link: { type: "doc", id: "iam/access-management/overview" },
          items: [
            "iam/access-management/roles-reference",
            "iam/access-management/filtering",
            "iam/access-management/workload-identities",
            "iam/access-management/troubleshooting",
          ],
        },
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
