import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SuspenseLoader } from '~components/SuspenseLoader';

const TicketListPage = React.lazy(() =>
  import('@/features/trouble-tickets').then((m) => ({ default: m.TicketListPage })),
);

function IndexComponent(): React.JSX.Element {
  return (
    <SuspenseLoader>
      <TicketListPage />
    </SuspenseLoader>
  );
}

export const Route = createFileRoute('/')({
  component: IndexComponent,
  loader: () => ({ crumb: 'Zgłoszenia' }),
});
