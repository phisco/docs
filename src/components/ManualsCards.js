import React from 'react';
import CardGrid from './CardGrid';

const sections = [
  {
    title: 'Upbound hub',
    description: 'Configure the central management layer for the Upbound platform.',
    link: '/hub/'
  },
  {
    title: 'Upbound Crossplane (UXP)',
    description: 'Enterprise-grade Crossplane distribution with enhanced compositions, functions, operations, and package management.',
    link: '/manuals/uxp/overview'
  },
  {
    title: 'Cloud Spaces',
    description: 'Managed Crossplane control planes in the Upbound cloud environment.',
    link: '/cloud-spaces/overview/'
  },
  {
    title: 'Self-hosted Spaces',
    description: 'Managed Crossplane control planes as a self-hosted deployment.',
    link: '/self-hosted-spaces/overview/'
  },
  {
    title: 'Platform',
    description: 'Identity management, RBAC, organizations, teams, and SSO integration for enterprise deployments.',
    link: './platform/overview'
  },
  {
    title: 'CLI',
    description: 'Command-line tools for managing Upbound configurations, contexts, and project tooling.',
    link: '/manuals/cli/overview'
  },
  {
    title: 'Console',
    description: 'Operate your control planes from one place: usage and logs, the resource explorer, the Crossplane WebUI, and the Query API.',
    link: '/manuals/console/upbound-console'
  },
  {
    title: 'Official Packages',
    description: 'Production-ready provider packages for cloud and infrastructure platforms with authentication and migration guides.',
    link: '/manuals/packages/overview'
  },
  {
    title: 'Marketplace',
    description: 'Package discovery, publishing, and repository management platform for internal and public distribution.',
    link: '/manuals/marketplace/overview'
  },
];

const ManualsCards = () => <CardGrid sections={sections} />;

export default ManualsCards;
