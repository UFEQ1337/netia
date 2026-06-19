import React, { useCallback, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ticketApi } from '../api/ticketApi';
import { useMuiSnackbar } from '@/hooks/useMuiSnackbar';
import type { ApiError } from '@/services/api';
import type { TroubleTicketCreateRequest } from '~types/api';

interface FormState {
  externalId: string;
  serviceId: string;
  description: string;
  note: string;
}

const INITIAL_STATE: FormState = {
  externalId: '',
  serviceId: '',
  description: '',
  note: '',
};

export const CreateTicketPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useMuiSnackbar();

  const mutation = useMutation({
    mutationFn: (req: TroubleTicketCreateRequest) => ticketApi.createTicket(req),
    onSuccess: (ticket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      showSuccess('Zgłoszenie zostało utworzone');
      navigate({ to: '/tickets/$id', params: { id: ticket.externalId } });
    },
    onError: (error: ApiError) => {
      showError(error.message);
    },
  });

  const handleChange = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement>): void => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
      },
    [],
  );

  const handleBlur = useCallback(
    (field: keyof FormState) => (): void => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    },
    [],
  );

  const isInvalid = useCallback(
    (field: keyof FormState): boolean => touched[field] === true && form[field].trim() === '',
    [form, touched],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent): void => {
      e.preventDefault();
      setTouched({ externalId: true, serviceId: true, description: true });

      if (!form.externalId.trim() || !form.serviceId.trim() || !form.description.trim()) return;
      if (isNaN(Number(form.serviceId)) || Number(form.serviceId) < 1) return;

      const req: TroubleTicketCreateRequest = {
        externalId: form.externalId.trim(),
        serviceId: Number(form.serviceId),
        description: form.description.trim(),
        status: 'new',
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
      };
      mutation.mutate(req);
    },
    [form, mutation],
  );

  const handleBack = useCallback((): void => {
    navigate({ to: '/' });
  }, [navigate]);

  return (
    <Box sx={{ maxWidth: 640 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mb: 2 }}>
        Powrót do listy
      </Button>
      <Typography variant="h5" fontWeight={600} sx={{ mb: 3 }}>
        Nowe zgłoszenie
      </Typography>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="ID zewnętrzny"
            value={form.externalId}
            onChange={handleChange('externalId')}
            onBlur={handleBlur('externalId')}
            error={isInvalid('externalId')}
            helperText={isInvalid('externalId') ? 'Pole wymagane' : undefined}
            fullWidth
            required
            sx={{ mb: 3 }}
          />
          <TextField
            label="ID usługi"
            type="number"
            value={form.serviceId}
            onChange={handleChange('serviceId')}
            onBlur={handleBlur('serviceId')}
            error={isInvalid('serviceId')}
            helperText={isInvalid('serviceId') ? 'Pole wymagane (liczba > 0)' : undefined}
            fullWidth
            required
            inputProps={{ min: 1 }}
            sx={{ mb: 3 }}
          />
          <TextField
            label="Opis"
            value={form.description}
            onChange={handleChange('description')}
            onBlur={handleBlur('description')}
            error={isInvalid('description')}
            helperText={isInvalid('description') ? 'Pole wymagane' : undefined}
            fullWidth
            required
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />
          <TextField
            label="Notatka inicjalna (opcjonalna)"
            value={form.note}
            onChange={handleChange('note')}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={mutation.isPending}
            startIcon={mutation.isPending ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {mutation.isPending ? 'Tworzenie...' : 'Utwórz zgłoszenie'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateTicketPage;
