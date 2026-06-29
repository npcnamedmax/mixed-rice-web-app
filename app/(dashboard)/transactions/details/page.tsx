import { Tabs, TabsContent } from '@/components/ui/tabs';

import { getTransactionWithDetail } from '@/lib/db';
import { dbRunner } from '@/lib/dbClient';
import { TransactionDetailView } from './transaction-detail';
import { notFound } from 'next/navigation';
import {
  getTransactionPredictionData,
  getClassIdNameMap
} from '@/actions/transactionActions';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage(props: {
  searchParams: Promise<{ id: number }>;
}) {
  const searchParams = await props.searchParams;
  const id = searchParams.id;
  if (!id) return notFound();
  const { transaction } = await dbRunner((db) =>
    getTransactionWithDetail(db, id)
  );
  if (!transaction) return notFound();

  const [{ imageUrl, predictions }, classIdNameMap] = await Promise.all([
    getTransactionPredictionData(transaction.imgName, transaction.jsonName),
    getClassIdNameMap()
  ]);

  const isAgnostic =
    transaction.model_type === 'YOLOv11_CA' ||
    transaction.model_type === 'YOLOv12_CA' ||
    transaction.model_type === 'RT-DETR_CA';

  return (
    <Tabs defaultValue="all">
      <TabsContent value="all">
        <TransactionDetailView
          transaction={transaction}
          imageUrl={imageUrl}
          predictions={predictions}
          isAgnostic={isAgnostic}
          classIdNameMap={classIdNameMap}
        />
      </TabsContent>
    </Tabs>
  );
}

