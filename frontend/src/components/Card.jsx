import React from 'react'
import './card.css'
const Card = ({ title, children, footer }) => {
  return (
    <div className="card" role="region" aria-label={title}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-content content-flex">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

export default Card