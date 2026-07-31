import React from 'react';

const CardGrid = ({ sections }) => (
  <div className="documentation-cards-grid">
    {sections.map((section, index) => (
      <a key={index} href={section.link} className="documentation-card">
        <h3 className="documentation-card-title">{section.title}</h3>
        <p className="documentation-card-description">{section.description}</p>
      </a>
    ))}
  </div>
);

export default CardGrid;
