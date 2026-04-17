'use client';
import Image from 'next/image';
import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table,
  TableCell
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TransactionTypeWithDetail } from '@/lib/db';

export function InferenceScreen({
  transaction
}: {
  transaction: TransactionTypeWithDetail;
}) {
  return (
    <Card className="w-full h-screen border-none shadow-none bg-transparent">
      <CardContent className="p-0 h-full">
        <div className="grid grid-cols-1 md:grid-cols-10 gap-6 h-full">
          <Card className="col-span-1 md:col-span-6 flex items-center justify-center overflow-hidden bg-muted/20">
            <Image
              alt="img"
              className="object-contain"
              height={400}
              width={400}
              src={
                'https://t4.ftcdn.net/jpg/06/71/92/37/360_F_671923740_x0zOL3OIuUAnSF6sr7PuznCI5bQFKhI0.jpg'
              }
            />
          </Card>

          <div className="col-span-1 md:col-span-4 flex flex-col gap-6 h-full">
            <Card className="w-full flex-4 flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Transacted Items</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 px-6 pb-6">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Rate
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Predicted Mass
                      </TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.transactionItems
                      .filter(
                        (t) =>
                          t.itemStatus === 'PREDICTED_ITEM' ||
                          t.itemStatus === 'VENDOR_ADDED'
                      )
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium capitalize">
                            {t.foodItem.name}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground">
                            ${t.foodPrice.stepPrice}/{t.foodPrice.priceInterval}
                            g
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {t.predictedMass ? `${t.predictedMass}g` : '-'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            ${t.finalPrice}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="w-full flex-4 flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>False Positives</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 px-6 pb-6">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">
                        Predicted Mass
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transaction.transactionItems
                      .filter((t) => t.itemStatus === 'VENDOR_REMOVED')
                      .map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium capitalize">
                            {t.foodItem.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {t.predictedMass}g
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="w-full bg-primary/5 border-primary/20 flex-1 flex flex-col justify-center min-h-0 shrink-0">
              <CardContent className="p-6 flex items-center justify-between">
                <span className="text-lg font-bold">Total Paid</span>
                <span className="text-2xl font-mono font-bold text-primary">
                  ${transaction.totalPrice}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
