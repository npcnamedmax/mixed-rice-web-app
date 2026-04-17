'use client';
import { Button } from '@/components/ui/button';
import { foodItemType } from '@/lib/db';
import { useRef, useState } from 'react';
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FoodList } from '@/components/food/foodList';
import { InsertTransactionitems } from '@/lib/schema';
import { getMoreFoodItems } from '@/actions/foodActions';
import { TransactionItemView } from './inference-module';

export function FoodItemAddModule({
  addFoodItem,
  initFoodItems,
  initNewOffset
}: {
  addFoodItem: (f: TransactionItemView) => void;
  initFoodItems: foodItemType[];
  initNewOffset: number | null;
}) {
  const [foodItem, setFoodItem] = useState<foodItemType | null>(null);
  const [foodItems, setFoodItems] = useState(initFoodItems);
  const [isLoading, setIsLoading] = useState(false);
  const [newOffset, setOffset] = useState<number | null>(initNewOffset);
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);

  const onLoadMore = async () => {
    if (isLoading || !newOffset) return;
    setIsLoading(true);
    try {
      const { foodItems: fetchedItems, newOffset: nextOffset } =
        await getMoreFoodItems(newOffset, searchTerm, 8);
      setFoodItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id));
        const newItems = fetchedItems.filter((i) => !existingIds.has(i.id));
        return [...prev, ...newItems];
      });
      setOffset(nextOffset);
    } catch (err) {
      console.error('Failed to load more food items:', err);
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

  const onAdd = (foodItem: foodItemType | null) => {
    if (foodItem === null) return;
    let f: TransactionItemView = {
      foodId: foodItem.classId,
      itemStatus: 'VENDOR_ADDED',
      activePriceId: foodItem.activePriceId,
      finalPrice: inputRef.current ? inputRef.current.value : '0',
      name: foodItem.name,
      priceInterval: foodItem.foodPrices.priceInterval,
      stepPrice: foodItem.foodPrices.stepPrice,
      selectedMassIndex: 0
    };
    addFoodItem(f);
    setFoodItem(null);
  };

  if (foodItem) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <div className="font-semibold text-lg">
          Set Price for {foodItem.name}
        </div>
        <FieldGroup className="py-6">
          <Field>
            <Label htmlFor="finalPrice">
              Price{' '}
              {`(${foodItem?.foodPrices?.stepPrice ?? 0}/${foodItem?.foodPrices?.priceInterval ?? 0}g)`}
            </Label>
            <Input
              id="name"
              name="finalPrice"
              ref={inputRef}
              // Fixed the crash bug here!
              defaultValue={foodItem?.foodPrices?.stepPrice || '0'}
            />
          </Field>
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setFoodItem(null)}>
            Back to List
          </Button>
          <Button type="button" onClick={() => onAdd(foodItem)}>
            Add to Cart
          </Button>
        </div>
      </div>
    );
  }

  return (
    <FoodList
      foodItems={foodItems}
      onSelectFood={(f) => setFoodItem(f)}
      onSearch={onSearch}
      onLoadMore={onLoadMore}
      searchTerm={searchTerm}
      isLoading={isLoading}
      className="border-0"
    />
  );
}
