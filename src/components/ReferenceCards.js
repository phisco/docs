import React from 'react';
import CardGrid from './CardGrid';

const sections = [
  {
    title: 'APIs',
    description: 'Crossplane API, Query API, Spaces API, UXP API, and Project & Testing API with CRD specifications.',
    link: '/reference/apis'
  },
  {
    title: 'CLI Reference',
    description: 'Command-line interface documentation with complete command reference and usage examples.',
    link: '/reference/cli-reference'
  },
  {
    title: 'Spaces Helm Reference',
    description: 'Helm chart configuration and deployment reference documentation for Upbound Spaces.',
    link: '/self-hosted-spaces/reference/'
  },
  {
    title: 'UXP Helm Reference',
    description: 'Helm chart configuration and deployment reference documentation for UXP.',
    link: '/reference/uxp-helm-reference'
  },
  {
    title: 'Release Notes',
    description: 'Latest updates and changes for Spaces, Managed Control Plane Connector, and Up CLI with version history.',
    link: '/reference/release-notes'
  },
  {
    title: 'CVE Policy',
    description: 'How Upbound identifies, prioritizes, and remediates CVEs across the Upbound Platform.',
    link: '/reference/cve-policy'
  },
  {
    title: 'Usage & Operations',
    description: 'Feature lifecycle, licensing, telemetry, support information, and VS Code extensions.',
    link: '/reference/usage'
  }
];

const ReferenceCards = () => <CardGrid sections={sections} />;

export default ReferenceCards;
