import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Alert, Badge, Button, InputGroup, FormControl, Form, Dropdown } from 'react-bootstrap';
import CompanyCard from './CompanyCard';
import { tourismCompanies, getTypeName, getTypeIcon, getTypeColor } from './data/tourismCompanies';

const WorkplaceExperience = () => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');

  // Get all companies from active tab
  const getFilteredCompanies = () => {
    let companies = tourismCompanies[activeTab] || [];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      companies = companies.filter(company => 
        company.name.toLowerCase().includes(term) ||
        company.country.toLowerCase().includes(term) ||
        company.description.toLowerCase().includes(term)
      );
    }
    
    if (filterCountry !== 'all') {
      companies = companies.filter(company => company.country === filterCountry);
    }
    
    return companies.sort((a, b) => a.name.localeCompare(b.name));
  };

  const filteredCompanies = getFilteredCompanies();
  
  // Get unique countries
  const getAllCountries = () => {
    const countries = new Set();
    Object.values(tourismCompanies).flat().forEach(company => {
      countries.add(company.country);
    });
    return ['all', ...Array.from(countries)].sort();
  };

  const countries = getAllCountries();

  return (
    <Container fluid className="px-lg-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold mb-3">
          <i className="fas fa-building me-2"></i>
          Tourism Company Opportunities
        </h2>
        <p className="text-muted mb-4">
          Direct links to career pages of verified tourism companies
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text className="bg-white">
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search companies or opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" onClick={() => setSearchTerm('')}>
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}>
                <option value="all">All Countries</option>
                {countries.filter(c => c !== 'all').map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Nav variant="pills" className="mb-4 justify-content-center flex-wrap" activeKey={activeTab} onSelect={setActiveTab}>
        {Object.keys(tourismCompanies).map(key => (
          <Nav.Item key={key} className="mb-2 mx-1">
            <Nav.Link 
              eventKey={key}
              className={`rounded-pill px-4 ${activeTab === key ? 'active' : ''}`}
              style={{ 
                backgroundColor: activeTab === key ? `var(--bs-${getTypeColor(key)})` : 'transparent',
                border: '1px solid #dee2e6'
              }}
            >
              <span className="me-2">{getTypeIcon(key)}</span>
              {getTypeName(key)}
              <Badge bg={activeTab === key ? "light" : getTypeColor(key)} className="ms-2">
                {tourismCompanies[key].length}
              </Badge>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      {/* Company Cards */}
      {filteredCompanies.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <i className="fas fa-search fa-3x mb-3 text-muted"></i>
          <h5>No companies found</h5>
          <p className="text-muted">Try adjusting your search or filter</p>
          <Button variant="outline-primary" onClick={() => { setSearchTerm(''); setFilterCountry('all'); }}>
            Clear Filters
          </Button>
        </Alert>
      ) : (
        <>
          <Row className="g-4 mb-4">
            {filteredCompanies.map(company => (
              <Col key={company.id} xs={12} md={6} lg={4}>
                <CompanyCard company={company} />
              </Col>
            ))}
          </Row>
          
          <Alert variant="light" className="text-center">
            <small className="text-muted">
              Showing {filteredCompanies.length} companies • 
              Click "Visit Career Page" to apply directly on company websites
            </small>
          </Alert>
        </>
      )}
    </Container>
  );
};

export default WorkplaceExperience;