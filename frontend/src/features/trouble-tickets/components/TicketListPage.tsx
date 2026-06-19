import React, { useCallback } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ticketApi } from '../api/ticketApi';
import { StatusChip } from './StatusChip';

export const TicketListPage: React.FC = () => {
  const { data: tickets } = useSuspenseQuery({
    queryKey: ['tickets'],
    queryFn: () => ticketApi.listTickets(),
  });

  const navigate = useNavigate();

  const handleRowClick = useCallback(
    (externalId: string): void => {
      navigate({ to: '/tickets/$id', params: { id: externalId } });
    },
    [navigate],
  );

  const handleCreate = useCallback((): void => {
    navigate({ to: '/tickets/new' });
  }, [navigate]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={600}>
          Zgłoszenia
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
          Nowe zgłoszenie
        </Button>
      </Box>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>ID zewnętrzny</strong>
              </TableCell>
              <TableCell>
                <strong>Usługa</strong>
              </TableCell>
              <TableCell>
                <strong>Opis</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                  Brak zgłoszeń
                </TableCell>
              </TableRow>
            )}
            {tickets.map((ticket) => (
              <TableRow
                key={ticket.externalId}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(ticket.externalId)}
              >
                <TableCell>{ticket.externalId}</TableCell>
                <TableCell>{ticket.serviceId}</TableCell>
                <TableCell sx={{ maxWidth: 400 }}>
                  <Typography noWrap title={ticket.description}>
                    {ticket.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <StatusChip status={ticket.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TicketListPage;
