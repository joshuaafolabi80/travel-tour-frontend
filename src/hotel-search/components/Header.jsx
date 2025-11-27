import React from 'react'
import { useNavigate } from 'react-router-dom'

const Header = () => {
  const navigate = useNavigate()

  return (
    <nav className="navbar navbar-dark bg-primary shadow-sm">
      <div className="container">
        <span 
          className="navbar-brand mb-0 h1 cursor-pointer"
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          <i className="bi bi-geo-alt-fill me-2"></i>
          Global Hotel Finder
        </span>
      </div>
    </nav>
  )
}

export default Header