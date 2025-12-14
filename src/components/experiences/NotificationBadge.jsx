import React from 'react';
import { Badge } from 'react-bootstrap';

const NotificationBadge = ({ count, type = 'info', size = 'sm' }) => {
  if (!count || count === 0) return null;

  return (
    <Badge 
      bg={type} 
      pill 
      className={`notification-badge ${size === 'lg' ? 'fs-6' : 'fs-7'}`}
      style={{
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        minWidth: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
};

export default NotificationBadge;