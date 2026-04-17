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
import { foodItemType } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FoodItem } from './foodItem';

export function FoodItemsTable({
  foodItems,
  offset,
  totalItems,
  searchString = null
}: {
  foodItems: foodItemType[];
  offset: number;
  totalItems: number;
  searchString?: string | null;
}) {
  let router = useRouter();
  let itemsPerPage = 5;

  function prevPage() {
    router.back();
  }

  function nextPage() {
    const params = new URLSearchParams();
    params.set('offset', offset.toString());
    if (searchString) {
      params.set('q', searchString);
    }
    router.push(`/?${params.toString()}`, { scroll: false });
  }
  const left =
    offset === 0
      ? totalItems - (totalItems % itemsPerPage) + 1
      : offset - itemsPerPage + 1;

  const right = offset === 0 ? totalItems : offset;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
        <CardDescription>Manage your food items.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Step Price</TableHead>
              <TableHead>Price Interval</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foodItems.map((food) => (
              <FoodItem key={food.id} foodItem={food} />
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
              disabled={offset === itemsPerPage}
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
