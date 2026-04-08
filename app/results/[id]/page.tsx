import { Suspense } from 'react';
import { ResultsPage } from '@/components/results/ResultsPage';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <ResultsPage id={params.id} />
    </Suspense>
  );
}
