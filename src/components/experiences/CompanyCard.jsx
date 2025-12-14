import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { getTypeIcon, getTypeColor } from './data/tourismCompanies';

const CompanyCard = ({ company }) => {
  const extractDomain = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Get the Bootstrap color class
  const typeColor = getTypeColor(company.type);
  
  return (
    <Card className="h-100 shadow-sm border-0" style={{ 
      transition: 'transform 0.2s, box-shadow 0.2s',
      height: '100%'
    }}>
      <Card.Header 
        className={`bg-${typeColor} bg-opacity-10 border-0`}
        style={{ padding: '1.25rem' }}
      >
        <div className="d-flex align-items-center">
          <div className="flex-grow-1">
            <div className="d-flex align-items-center mb-2">
              <span className="fs-4 me-2">{getTypeIcon(company.type)}</span>
              <h5 className="mb-0">
                <strong>{company.name}</strong>
                {company.verified && (
                  <i className="fas fa-check-circle text-success ms-2" title="Verified company"></i>
                )}
              </h5>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <Badge bg="light" text="dark" className="d-flex align-items-center">
                <i className="fas fa-map-marker-alt me-1"></i>
                {company.country}
              </Badge>
              <Badge bg={typeColor} className="d-flex align-items-center">
                {company.type.charAt(0).toUpperCase() + company.type.slice(1)}
              </Badge>
            </div>
          </div>
          {company.logo && (
            <div style={{ width: '60px', height: '60px' }}>
              <img 
                src={company.logo} 
                alt={`${company.name} logo`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain' 
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = 
                    `<div class="rounded-circle bg-${typeColor} bg-opacity-25 d-flex align-items-center justify-content-center" style="width:60px;height:60px">
                       <span class="fs-4">${getTypeIcon(company.type)}</span>
                     </div>`;
                }}
              />
            </div>
          )}
        </div>
      </Card.Header>

      <Card.Body style={{ padding: '1.25rem' }}>
        <p className="text-muted mb-3" style={{ lineHeight: '1.6' }}>
          {company.description}
        </p>

        <div className="mb-3">
          <h6 className="mb-2">
            <i className="fas fa-briefcase me-2"></i>
            <strong>Common Opportunities:</strong>
          </h6>
          <div className="d-flex flex-wrap gap-1">
            {company.opportunities && company.opportunities.map((opp, index) => (
              <Badge 
                key={index} 
                bg="light" 
                text="dark" 
                className="px-2 py-1"
                style={{ fontSize: '0.8rem' }}
              >
                {opp}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-3">
          <small className="text-muted">
            <i className="fas fa-clock me-1"></i>
            Last updated: {company.lastUpdated}
          </small>
        </div>
      </Card.Body>

      <Card.Footer className="bg-white border-top-0" style={{ padding: '1.25rem' }}>
        <div className="d-grid gap-2">
          <Button 
            variant="primary" 
            href={company.careerPage} 
            target="_blank"
            className="d-flex align-items-center justify-content-center"
          >
            <i className="fas fa-external-link-alt me-2"></i>
            Visit Career Page
          </Button>
          <Button 
            variant="outline-secondary" 
            href={company.website} 
            target="_blank"
            size="sm"
          >
            <i className="fas fa-globe me-1"></i>
            Company Website
          </Button>
        </div>
        <div className="text-center mt-2">
          <small className="text-muted">
            <i className="fas fa-link me-1"></i>
            {extractDomain(company.website)}
          </small>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default CompanyCard;