import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getTransactionWithDetail } from '@/lib/db';
import { dbRunner } from '@/lib/dbClient';
import { InferenceScreen } from '../../inference';
import { error } from 'console';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(props: {
  searchParams: Promise<{ id: number }>;
}) {
  const searchParams = await props.searchParams;
  const id = searchParams.id;
  if (!id) throw error();
  const { transaction } = await dbRunner((db) =>
    getTransactionWithDetail(
      db,
      // search, //can add filtering ltr
      id
    )
  );
  if (!transaction) throw error();

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <InferenceScreen transaction={transaction} />
      </TabsContent>
    </Tabs>
  );
}
