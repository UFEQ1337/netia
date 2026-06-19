import apiFetch from '@/services/api';
import type {
  TroubleTicket,
  TroubleTicketSummary,
  TroubleTicketCreateRequest,
  NoteCreateRequest,
  Note,
} from '~types/api';

const PATH = '/troubleTicket';

export const ticketApi = {
  listTickets: (): Promise<TroubleTicketSummary[]> => apiFetch<TroubleTicketSummary[]>(PATH),

  getTicket: (id: string): Promise<TroubleTicket> => apiFetch<TroubleTicket>(`${PATH}/${id}`),

  createTicket: (req: TroubleTicketCreateRequest): Promise<TroubleTicket> =>
    apiFetch<TroubleTicket>(PATH, {
      method: 'POST',
      body: JSON.stringify(req),
    }),

  closeTicket: (id: string): Promise<TroubleTicket> =>
    apiFetch<TroubleTicket>(`${PATH}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'closed' }),
    }),

  addNote: (ticketId: string, req: NoteCreateRequest): Promise<Note> =>
    apiFetch<Note>(`${PATH}/${ticketId}/note`, {
      method: 'POST',
      body: JSON.stringify(req),
    }),
};
