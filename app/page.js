import { Suspense } from 'react';
import StatusDashboard from './StatusDashboard';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatusDashboard />
    </Suspense>
  );
}
