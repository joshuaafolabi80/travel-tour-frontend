import React, { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Nav, 
  Alert, 
  Badge, 
  Button, 
  InputGroup, 
  FormControl, 
  Form, 
  Dropdown 
} from 'react-bootstrap';
import CompanyCard from './CompanyCard';
import { tourismCompanies, getTypeName, getTypeIcon, getTypeColor } from './data/tourismCompanies';

const WorkplaceExperience = () => {
  const [activeTab, setActiveTab] = useState('hotels');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Get all companies from active tab
  const getFilteredCompanies = () => {
    let companies = tourismCompanies[activeTab] || [];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      companies = companies.filter(company => 
        company.name.toLowerCase().includes(term) ||
        company.country.toLowerCase().includes(term) ||
        company.description.toLowerCase().includes(term) ||
        company.opportunities?.some(opp => opp.toLowerCase().includes(term))
      );
    }
    
    if (filterCountry !== 'all') {
      companies = companies.filter(company => company.country === filterCountry);
    }
    
    // Apply sorting
    switch(sortBy) {
      case 'name':
        companies.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'country':
        companies.sort((a, b) => a.country.localeCompare(b.country));
        break;
      case 'recent':
        companies.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        break;
      default:
        companies.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return companies;
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

  // Get the color for a specific tab
  const getTabColor = (tabKey) => {
    const color = getTypeColor(tabKey);
    return color;
  };

  // Get badge color based on active state
  const getBadgeColor = (tabKey, isActive) => {
    return isActive ? "light" : getTypeColor(tabKey);
  };

  return (
    <Container fluid className="px-lg-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="fw-bold mb-3">
          <i className="fas fa-building me-2"></i>
          Travels, Hotels, Tourism and Tours Company Opportunities.
        </h2>
        <p className="text-muted mb-4">
          Direct links to career pages of verified Travels, Hotels, Tourism and Tours  companies.
        </p>
      </div>

      

      {/* Controls */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            {/* Search */}
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <i className="fas fa-search"></i>
                </InputGroup.Text>
                <FormControl
                  placeholder="Search companies, opportunities, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-start-0"
                />
                {searchTerm && (
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </InputGroup>
            </div>

            {/* Country Filter */}
            <div className="col-md-3">
              <Form.Select 
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
              >
                <option value="all">All Countries</option>
                {countries.filter(c => c !== 'all').map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </Form.Select>
            </div>

            {/* Sort By */}
            <div className="col-md-3">
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                  <i className="fas fa-sort me-2"></i>
                  Sort: {sortBy === 'name' ? 'Name' : 
                         sortBy === 'country' ? 'Country' : 'Recent'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setSortBy('name')}>
                    <i className="fas fa-sort-alpha-down me-2"></i> Sort by Name
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy('country')}>
                    <i className="fas fa-globe me-2"></i> Sort by Country
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setSortBy('recent')}>
                    <i className="fas fa-clock me-2"></i> Sort by Recent
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabs Navigation */}
      <div className="mb-4">
        <Nav variant="pills" className="justify-content-center flex-wrap" activeKey={activeTab} onSelect={setActiveTab}>
          {Object.keys(tourismCompanies).map(key => {
            const isActive = activeTab === key;
            const tabColor = getTabColor(key);
            const badgeColor = getBadgeColor(key, isActive);
            
            return (
              <Nav.Item key={key} className="mb-2 mx-1">
                <Nav.Link 
                  eventKey={key}
                  className={`rounded-pill px-4 ${isActive ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: isActive ? `var(--bs-${tabColor})` : 'transparent',
                    color: isActive ? 'white' : 'inherit',
                    border: isActive ? 'none' : '1px solid #dee2e6'
                  }}
                >
                  <span className="me-2 fs-5">{getTypeIcon(key)}</span>
                  {getTypeName(key)}
                  <Badge bg={badgeColor} text={isActive ? "dark" : "white"} className="ms-2">
                    {tourismCompanies[key].length}
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
      </div>

      {/* Company Cards Grid */}
      {filteredCompanies.length === 0 ? (
        <Alert variant="info" className="text-center py-5">
          <div className="display-1 mb-3">🔍</div>
          <h4 className="mb-3">No companies found</h4>
          <p className="text-muted mb-4">
            Try adjusting your search or filters
          </p>
          <Button 
            variant="outline-primary"
            onClick={() => {
              setSearchTerm('');
              setFilterCountry('all');
              setSortBy('name');
            }}
          >
            Clear All Filters
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

          {/* Results Summary */}
          <Card className="border-0 bg-light">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0">
                    Showing {filteredCompanies.length} of {tourismCompanies[activeTab].length} {getTypeName(activeTab).toLowerCase()}
                  </h6>
                  {(searchTerm || filterCountry !== 'all' || sortBy !== 'name') && (
                    <small className="text-muted">
                      Filters: 
                      {searchTerm && ` Search: "${searchTerm}"`} 
                      {filterCountry !== 'all' && ` • Country: ${filterCountry}`}
                      {sortBy !== 'name' && ` • Sorted by: ${sortBy}`}
                    </small>
                  )}
                </div>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <i className="fas fa-arrow-up me-1"></i> Back to top
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )}

      {/* Footer Resources */}
      <Card className="mt-5 border-0 shadow-sm">
        <Card.Body className="text-center">
          <h5 className="mb-3">Additional Job Resources</h5>
          <div className="d-flex flex-wrap justify-content-center gap-3">
            <Button 
              variant="outline-primary"
              href="https://www.linkedin.com/jobs/"
              target="_blank"
              className="d-flex align-items-center"
            >
              <i className="fab fa-linkedin me-2"></i> LinkedIn Jobs
            </Button>
            <Button 
              variant="outline-success"
              href="https://www.indeed.com/"
              target="_blank"
              className="d-flex align-items-center"
            >
              <i className="fas fa-search me-2"></i> Indeed
            </Button>
            <Button 
              variant="outline-info"
              href="https://www.glassdoor.com/index.htm"
              target="_blank"
              className="d-flex align-items-center"
            >
              <i className="fas fa-building me-2"></i> Glassdoor
            </Button>
            <Button 
              variant="outline-warning"
              href="https://ng.linkedin.com/jobs/hospitality-tourism-jobs"
              target="_blank"
              className="d-flex align-items-center"
            >
              <i className="fas fa-umbrella-beach me-2"></i> Travel, Hotel, Tourism and Tour Jobs NG
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default WorkplaceExperience;