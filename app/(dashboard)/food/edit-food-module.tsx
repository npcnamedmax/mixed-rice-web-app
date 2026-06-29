'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { foodItemType } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';

import { FoodList } from '@/components/food/foodList';
import { useState, useTransition } from 'react';
import {
  getMoreFoodItems,
  submitEdit,
  createFoodItem
} from '@/actions/foodActions';
import { Spinner } from '@/components/icons';
import { PlusCircle } from 'lucide-react';

export function FoodItemEditModule({
  initFoodItems,
  initNewOffset,
  initSearch
}: {
  initFoodItems: foodItemType[];
  initNewOffset: number | null;
  initSearch: string | undefined;
}) {
  const [foodItem, setFoodItem] = useState<foodItemType | null>(null);
  const [foodItems, setFoodItems] = useState(initFoodItems);
  const [isLoading, setIsLoading] = useState(false);
  const [newOffset, setOffset] = useState<number | null>(initNewOffset);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(initSearch);

  const [isPending, startTransition] = useTransition();

  const submitData = (f: FormData) => {
    startTransition(async () => {
      const { isSuccess } = await submitEdit(f);
      if (isSuccess) {
        const updatedId = Number(f.get('id'));
        //console.log(updatedId);
        setFoodItems((prev) =>
          prev.map((item) => {
            //console.log(`${item.id}, ${updatedId}, ${item.id === updatedId}`);
            if (Number(item.id) === updatedId) {
              return {
                ...item,
                name: f.get('name') as string,
                foodPrices: {
                  ...item.foodPrices,
                  stepPrice: f.get('stepPrice') as string,
                  priceInterval: Number(f.get('priceInterval'))
                }
              };
            }
            return item;
          })
        );
      }
      setFoodItem(null);
    });
  };

  const onLoadMore = async () => {
    if (isLoading || !newOffset) return;
    setIsLoading(true);
    try {
      const { foodItems: fetchedItems, newOffset: nextOffset } =
        await getMoreFoodItems(newOffset, searchTerm, 8);
      setFoodItems((prev) => [...prev, ...fetchedItems]);
      setOffset(nextOffset);
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const onSearch = async (val: string) => {
    setSearchTerm(val);
    setIsLoading(true);
    try {
      const { foodItems: fetchedItems, newOffset: nextOffset } =
        await getMoreFoodItems(0, val, 8);
      setFoodItems(fetchedItems);
      setOffset(nextOffset);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <FoodList
        foodItems={foodItems}
        onSelectFood={(f) => setFoodItem(f)}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        onSearch={onSearch}
        searchTerm={searchTerm}
      />
      <Dialog
        open={foodItem !== null}
        onOpenChange={(open) => !open && setFoodItem(null)}
      >
        <DialogContent>
          <form action={submitData}>
            <DialogHeader>
              <DialogTitle>Edit Food Detail</DialogTitle>
            </DialogHeader>
            <FieldGroup className="py-6">
              <Field>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={foodItem?.name || ''}
                />
              </Field>
              <Field>
                <Label htmlFor="stepPrice">Price Per Interval</Label>
                <Input
                  id="stepPrice"
                  defaultValue={foodItem?.foodPrices.stepPrice || ''}
                  name="stepPrice"
                />
              </Field>
              <Field>
                <Label htmlFor="priceInterval">Price Interval</Label>
                <Input
                  id="priceInterval"
                  defaultValue={foodItem?.foodPrices.priceInterval || ''}
                  name="priceInterval"
                />
              </Field>
            </FieldGroup>
            <input
              id="id"
              name="id"
              readOnly
              type="hidden"
              value={foodItem?.id || ''}
            />
            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Updating...' : 'Update'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
