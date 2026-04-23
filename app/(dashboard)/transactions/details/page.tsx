import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getTransactionWithDetail } from '@/lib/db';
import { dbRunner } from '@/lib/dbClient';
import { InferenceScreen } from '../../inference';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(props: {
  searchParams: Promise<{ id: number }>;
}) {
  const searchParams = await props.searchParams;
  const id = searchParams.id;
  if (!id) return notFound();
  const { transaction } = await dbRunner((db) =>
    getTransactionWithDetail(
      db,
      // search, //can add filtering ltr
      id
    )
  );
  if (!transaction) return notFound();

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <InferenceScreen transaction={transaction} />
      </TabsContent>
    </Tabs>
  );
}
