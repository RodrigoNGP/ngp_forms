import { Suspense } from 'react';
import { FormViewerPage } from '@/components/viewer/FormViewerPage';

export default function Page({ params }: { params: { id: string } }) {
  return (
    <Suspense>
      <FormViewerPage id={params.id} />
    </Suspense>
  );
}
