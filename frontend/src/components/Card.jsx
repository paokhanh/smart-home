import React from 'react'
import './card.css'
const Card = ({ title, children, footer, className, ...props }) => {
  return (
    <div className={`card ${className || ''}`} role="region" aria-label={title} {...props}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-content content-flex">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}

export default Card