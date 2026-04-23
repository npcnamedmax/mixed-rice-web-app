import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { TransactionType } from '@/lib/db';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
//import { deleteProduct } from './actions';

export function Transaction({
  transactionItem
}: {
  transactionItem: TransactionType;
}) {
  let router = useRouter();
  const pathname = usePathname();
  function visitDetailPage() {
    const params = new URLSearchParams();
    params.set('id', transactionItem.id.toString());
    /* if (searchString) {
      params.set('q', searchString);
    } */
    router.push(`${pathname}/details?${params.toString()}`, { scroll: false });
  }
  return (
    <TableRow onClick={() => visitDetailPage()} className="cursor-pointer">
      <TableCell className="font-medium text-ellipsis">
        {transactionItem.id}
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <Badge variant="outline" className="capitalize">
          {transactionItem.status}
        </Badge>
      </TableCell>
      <TableCell className="hidden md:table-cell">{`$${transactionItem.totalPrice}`}</TableCell>
      <TableCell className="hidden md:table-cell">{`${transactionItem.model_type}`}</TableCell>
      <TableCell className="hidden md:table-cell">
        {transactionItem.createdAt.toDateString()}
      </TableCell>
    </TableRow>
  );
}
