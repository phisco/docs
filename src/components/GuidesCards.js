import React from 'react';
import CardGrid from './CardGrid';

const sections = [
  {
    title: 'Intelligent Control Planes',
    description: 'Advanced control plane patterns with dynamic resource composition, log analysis, and database scaling.',
    link: '/guides/intelligent-control-planes/'
  },
  {
    title: 'Solutions',
    description: 'Complete platform deployments including general IDP architecture and Upbound platform reference implementations.',
    link: '/guides/solutions/get-started/'
  },
  {
    title: 'Use Cases',
    description: 'End-to-end scenarios for applications, cloud resources, databases as a service, and managed resources.',
    link: '/guides/usecases'
  }
];

const GuidesCards = () => <CardGrid sections={sections} />;

export default GuidesCards;
