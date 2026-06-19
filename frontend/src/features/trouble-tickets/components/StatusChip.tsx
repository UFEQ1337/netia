import React from 'react';
import type { ChipProps } from '@mui/material';
import { Chip } from '@mui/material';
import { TroubleTicketStatus } from '~types/api';

interface StatusChipProps {
  status: TroubleTicketStatus;
}

const STATUS_CONFIG: Record<TroubleTicketStatus, { label: string; color: ChipProps['color'] }> = {
  [TroubleTicketStatus.NEW]: { label: 'Nowe', color: 'default' },
  [TroubleTicketStatus.ACKNOWLEDGED]: { label: 'Przyjęte', color: 'info' },
  [TroubleTicketStatus.IN_PROGRESS]: { label: 'W toku', color: 'warning' },
  [TroubleTicketStatus.RESOLVED]: { label: 'Rozwiązane', color: 'success' },
  [TroubleTicketStatus.CLOSED]: { label: 'Zamknięte', color: 'secondary' },
  [TroubleTicketStatus.REJECTED]: { label: 'Odrzucone', color: 'error' },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? { label: status, color: 'default' };
  return <Chip label={config.label} color={config.color} size="small" />;
};

export default StatusChip;
