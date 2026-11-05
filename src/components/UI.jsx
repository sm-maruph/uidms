import React from 'react';
import Icon from './Icon.jsx';

export function Button({ children, variant = 'primary', icon, ...props }) {
  return <button className={`button button-${variant}`} {...props}>{icon && <Icon name={icon} size={17}/>}<span>{children}</span></button>;
}

export function Status({ children }) {
  const tone = children.toLowerCase().replaceAll(' ', '-');
  return <span className={`status status-${tone}`}><i />{children}</span>;
}

export function Avatar({ initials, tone = 'blue', size = '' }) {
  return <span className={`avatar avatar-${tone} ${size}`}>{initials}</span>;
}

export function SectionTitle({ eyebrow, title, children }) {
  return <div className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{children}</div>;
}
