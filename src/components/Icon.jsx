import React from 'react';

const paths = {
  logout: <><path d="M9 4H4v16h5M10 12h11m-4-4 4 4-4 4"/></>,
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  inbox: <><path d="M4 4h16v16H4z"/><path d="M4 13h4l2 3h4l2-3h4"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9L16 21h-3l-.3-2.2a8 8 0 0 1-1.7-.7l-1.8.8-1.5-2.5 1.6-1.3a7 7 0 0 1 0-1.9l-1.6-1.3 1.5-2.5 1.8.8a8 8 0 0 1 1.7-.7L13 7h3l.3 2.2a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.5 1.2a7 7 0 0 1 0 2z"/></>,
  search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
  filter: <><path d="M4 6h16M7 12h10m-7 6h4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  close: <><path d="m18 6-12 12M6 6l12 12"/></>,
  edit: <><path d="m4 20 4.5-1 9.8-9.8a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z"/><path d="m13.8 7.2 3 3"/></>,
  userPlus: <><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a6 6 0 0 1 10-4.5M19 14v7m-3.5-3.5h7"/></>,
  idCard: <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16a3 3 0 0 1 5 0M13 10h5m-5 4h5"/></>,
  trash: <><path d="M4 7h16m-10 4v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3"/></>,
  key: <><circle cx="8" cy="15" r="5"/><path d="m11.5 11.5 8-8 2 2-2 2 2 2-3 3-2-2-3 3"/></>,
  arrowUp: <><path d="M12 19V5m-6 6 6-6 6 6"/><path d="M5 20h14"/></>,
  branch: <><circle cx="7" cy="5" r="2"/><circle cx="17" cy="19" r="2"/><circle cx="17" cy="5" r="2"/><path d="M7 7v5a4 4 0 0 0 4 4h4m-2-2 2 2-2 2M9 5h6"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  forward: <><path d="M4 12h15m-6-6 6 6-6 6"/><path d="M5 6v12"/></>,
  hardDrive: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 14h18m-13 3h.01m4 0h.01"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></>,
  device: <><rect x="6" y="2.5" width="12" height="19" rx="2"/><path d="M10 5h4m-2 13.5h.01"/></>,
};

export default function Icon({ name, size = 20, ...props }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>{paths[name] || paths.grid}</svg>;
}
