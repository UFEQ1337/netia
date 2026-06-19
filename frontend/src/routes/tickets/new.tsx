import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SuspenseLoader } from '~components/SuspenseLoader';

const CreateTicketPage = React.lazy(() =>
  import('@/features/trouble-tickets').then((m) => ({ default: m.CreateTicketPage })),
);

function NewTicketComponent(): React.JSX.Element {
  return (
    <SuspenseLoader>
      <CreateTicketPage />
    </SuspenseLoader>
  );
}

export const Route = createFileRoute('/tickets/new')({
  component: NewTicketComponent,
  loader: () => ({ crumb: 'Nowe zgłoszenie' }),
});
