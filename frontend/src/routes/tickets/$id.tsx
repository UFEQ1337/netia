import React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { SuspenseLoader } from '~components/SuspenseLoader';
import { TicketDetailPage } from '@/features/trouble-tickets';

function TicketDetailRoute(): React.JSX.Element {
  const { id } = Route.useParams();
  return (
    <SuspenseLoader>
      <TicketDetailPage id={id} />
    </SuspenseLoader>
  );
}

export const Route = createFileRoute('/tickets/$id')({
  component: TicketDetailRoute,
  loader: ({ params }) => ({ crumb: params.id }),
});
