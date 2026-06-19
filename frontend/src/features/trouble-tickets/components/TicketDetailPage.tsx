import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockIcon from '@mui/icons-material/Lock';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ticketApi } from '../api/ticketApi';
import { StatusChip } from './StatusChip';
import { useMuiSnackbar } from '@/hooks/useMuiSnackbar';
import type { ApiError } from '@/services/api';
import { TroubleTicketStatus } from '~types/api';

interface TicketDetailPageProps {
  id: string;
}

const CLOSEABLE_STATUSES: TroubleTicketStatus[] = [
  TroubleTicketStatus.ACKNOWLEDGED,
  TroubleTicketStatus.IN_PROGRESS,
];

const NOTE_ALLOWED_STATUSES: TroubleTicketStatus[] = [
  TroubleTicketStatus.NEW,
  TroubleTicketStatus.ACKNOWLEDGED,
  TroubleTicketStatus.IN_PROGRESS,
];

export const TicketDetailPage: React.FC<TicketDetailPageProps> = ({ id }) => {
  const [noteText, setNoteText] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useMuiSnackbar();

  const { data: ticket } = useSuspenseQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicket(id),
  });

  const closeMutation = useMutation({
    mutationFn: () => ticketApi.closeTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showSuccess('Zgłoszenie zostało zamknięte');
    },
    onError: (error: ApiError) => {
      showError(error.message);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: () => ticketApi.addNote(id, { text: noteText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setNoteText('');
      showSuccess('Notatka została dodana');
    },
    onError: (error: ApiError) => {
      showError(error.message);
    },
  });

  const handleBack = useCallback((): void => {
    navigate({ to: '/' });
  }, [navigate]);

  const handleClose = useCallback((): void => {
    closeMutation.mutate();
  }, [closeMutation]);

  const handleAddNote = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      if (!noteText.trim()) return;
      addNoteMutation.mutate();
    },
    [noteText, addNoteMutation],
  );

  const canClose = CLOSEABLE_STATUSES.includes(ticket.status);
  const canAddNote = NOTE_ALLOWED_STATUSES.includes(ticket.status);

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Powrót do listy
      </Button>

      <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            {ticket.externalId}
          </Typography>
          <StatusChip status={ticket.status} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              ID usługi
            </Typography>
            <Typography>{ticket.serviceId}</Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          Opis
        </Typography>
        <Typography sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{ticket.description}</Typography>

        {canClose && (
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={
                closeMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <LockIcon />
                )
              }
              onClick={handleClose}
              disabled={closeMutation.isPending}
            >
              {closeMutation.isPending ? 'Zamykanie...' : 'Zamknij zgłoszenie'}
            </Button>
          </Box>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Notatki ({ticket.notes.length})
        </Typography>

        {ticket.notes.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            Brak notatek
          </Typography>
        )}

        <List disablePadding>
          {ticket.notes.map((note, index) => (
            <React.Fragment key={note.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start" disablePadding sx={{ py: 1.5 }}>
                <ListItemText
                  primary={note.text}
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {note.id} &bull; {new Date(note.date).toLocaleString('pl-PL')}
                    </Typography>
                  }
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {canAddNote && (
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Dodaj notatkę
          </Typography>
          <Box component="form" onSubmit={handleAddNote}>
            <TextField
              label="Treść notatki"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              fullWidth
              multiline
              rows={3}
              required
              sx={{ mb: 2 }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={
                addNoteMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <NoteAddIcon />
                )
              }
              disabled={addNoteMutation.isPending || !noteText.trim()}
            >
              {addNoteMutation.isPending ? 'Dodawanie...' : 'Dodaj notatkę'}
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default TicketDetailPage;
