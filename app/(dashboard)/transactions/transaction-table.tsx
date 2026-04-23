'use client';

import {
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  Table
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TransactionType } from '@/lib/db';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from './transaction';
import { useEffect } from 'react';

export function TransactionsTable({
  transactions,
  offset,
  totalItems
  //searchString = null
}: {
  transactions: TransactionType[];
  offset: number;
  totalItems: number;
  // searchString?: string | null; change to filtering
}) {
  let router = useRouter();
  const pathname = usePathname();
  let itemsPerPage = 5;

  function prevPage() {
    router.back();
  }

  function nextPage() {
    const params = new URLSearchParams();
    params.set('offset', offset.toString());
    /* if (searchString) {
      params.set('q', searchString);
    } */
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }
  useEffect(() => console.log(offset, itemsPerPage));
  const left =
    offset === 0
      ? totalItems - (totalItems % itemsPerPage) + 1
      : offset - itemsPerPage + 1;

  const right = offset === 0 ? totalItems : offset;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
        <CardDescription>View Transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Model Used</TableHead>
              <TableHead>Created on</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t, i) => (
              <Transaction key={i} transactionItem={t} />
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter>
        <form className="flex items-center w-full justify-between">
          <div className="text-xs text-muted-foreground">
            Showing{' '}
            <strong>
              {left}-{right}
            </strong>{' '}
            of <strong>{totalItems}</strong> products
          </div>
          <div className="flex">
            <Button
              formAction={prevPage}
              variant="ghost"
              size="sm"
              type="submit"
              disabled={offset < itemsPerPage}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Prev
            </Button>
            <Button
              formAction={nextPage}
              variant="ghost"
              size="sm"
              type="submit"
              disabled={offset === 0}
            >
              Next
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}
