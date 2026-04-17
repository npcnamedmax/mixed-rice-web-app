import { Tabs, TabsContent } from '@/components/ui/tabs';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { getTransactions } from '@/lib/db';
import { TransactionsTable } from './transaction-table';
import { dbRunner } from '@/lib/dbClient';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(props: {
  searchParams: Promise<{ q: string; offset: string }>;
}) {
  const searchParams = await props.searchParams;
  const offset = searchParams.offset ?? 0;
  const { transactions, newOffset, totalTransactions } = await dbRunner((db) =>
    getTransactions(
      // search, //can add filtering ltr
      db,
      Number(offset)
    )
  );

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <TransactionsTable
          transactions={transactions}
          offset={newOffset ?? 0}
          totalItems={totalTransactions}
          //   searchString={search} add filtering ltr
        />
      </TabsContent>
    </Tabs>
  );
}
