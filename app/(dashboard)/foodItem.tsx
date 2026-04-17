import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { foodItemType } from '@/lib/db';
import { FoodItemEditDialog } from './food/edit-food-module';
import { useState } from 'react';
//import { deleteProduct } from './actions';

export function FoodItem({ foodItem }: { foodItem: foodItemType }) {
  const [isOpen, setOpen] = useState(false);

  return (
    <TableRow>
      <TableCell className="hidden sm:table-cell">
        <Image
          alt="Product image"
          className="aspect-square rounded-md object-cover"
          height="64"
          src={
            foodItem.imageUrl ||
            'https://t4.ftcdn.net/jpg/06/71/92/37/360_F_671923740_x0zOL3OIuUAnSF6sr7PuznCI5bQFKhI0.jpg'
          }
          width="64"
        />
      </TableCell>
      <TableCell className="font-medium">{foodItem.name}</TableCell>

      <TableCell className="hidden md:table-cell">{`$${foodItem.foodPrices.stepPrice}`}</TableCell>
      <TableCell className="hidden md:table-cell">
        {foodItem.foodPrices.priceInterval}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem>
              <form action={''}>
                <button type="button">Delete</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <FoodItemEditDialog
          foodItem={foodItem}
          isOpen={isOpen}
          isOpenFc={setOpen}
        />
      </TableCell>
    </TableRow>
  );
}
