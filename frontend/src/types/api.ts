/** Possible statuses for a trouble ticket */
export enum TroubleTicketStatus {
  NEW = 'new',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'inProgress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

/** Summary item returned by the list endpoint */
export interface TroubleTicketSummary {
  externalId: string;
  serviceId: number;
  description: string;
  status: TroubleTicketStatus;
}

/** Note attached to a trouble ticket */
export interface Note {
  id: string;
  text: string;
  date: string;
}

/** Full trouble ticket with notes */
export interface TroubleTicket {
  externalId: string;
  serviceId: number;
  description: string;
  status: TroubleTicketStatus;
  notes: Note[];
}

/** Request payload for creating a new ticket */
export interface TroubleTicketCreateRequest {
  externalId: string;
  serviceId: number;
  description: string;
  status: 'new';
  note?: string;
}

/** Request payload for closing a ticket */
export interface TroubleTicketCloseStatusRequest {
  status: 'closed';
}

/** Request payload for adding a note */
export interface NoteCreateRequest {
  text: string;
}

/** API error response body */
export interface ApiErrorResponse {
  code: string;
  message: string;
  requestId?: string;
}
