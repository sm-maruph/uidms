import {hasPortalRole} from './portalRoles.js';
export const canGenerateRequestDocument=profile=>hasPortalRole(profile,'CITO','IT','Admin','Super Admin');
export const requestDocumentFilename=ticket=>`${String(ticket.id||'UIDMS').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,80)}-request.pdf`;
