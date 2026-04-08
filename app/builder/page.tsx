import { Suspense } from 'react';
import { BuilderPage } from '@/components/builder/BuilderPage';

export default function Page() {
  return (
    <Suspense>
      <BuilderPage />
    </Suspense>
  );
}
