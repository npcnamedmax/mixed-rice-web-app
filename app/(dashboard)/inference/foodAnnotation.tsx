'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { foodItemType } from '@/lib/db';
import { getMoreFoodItems } from '@/actions/foodActions';
import { Field, FieldGroup } from '../../../components/ui/field';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList
} from '../../../components/ui/combobox';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '../../../components/ui/item';
import { Button } from '../../../components/ui/button';
import { TransactionItemView } from './inference-module';
export type Labels = {
  //normalized coords
  x1_coord: number;
  y1_coord: number;
  width: number; //px
  height: number; //px
  className: string;
};

export const dummyLabels: Labels[] = [
  {
    x1_coord: 0.15, // 15% from the left
    y1_coord: 0.3, // 30% from the top
    width: 250, // 250px wide
    height: 180, // 180px tall
    className: 'Cheeseburger'
  },
  {
    x1_coord: 0.65, // 65% from the left
    y1_coord: 0.5, // 50% from the top
    width: 120, // 120px wide
    height: 150, // 150px tall
    className: 'French Fries'
  },
  {
    x1_coord: 0.75, // 75% from the left
    y1_coord: 0.1, // 10% from the top
    width: 80, // 80px wide
    height: 200, // 200px tall
    className: 'Soda Cola'
  }
];

export function FoodAnnotation({
  foodSrc,
  labels,
  isAgnostic,
  initFoodItems,
  initNewOffset,
  changeFoodItem
}: {
  foodSrc: string;
  labels: TransactionItemView[];
  isAgnostic: boolean;
  initFoodItems: foodItemType[];
  initNewOffset: number | null;
  changeFoodItem: (idx: number, updated: Partial<TransactionItemView>) => void;
}) {
  const [currentSelectedIndex, setCurrentSelectedIndex] = useState<
    number | null
  >(null);
  const currentSelectedItem =
    currentSelectedIndex !== null ? labels[currentSelectedIndex] : null; //got bug? need to chg to getter?
  const [stagedItem, setStagedItem] = useState<{
    foodId: number;
    selectedMassIndex: number;
    name: string;
    stepPrice: string;
    priceInterval: number;
    activePriceId: number;
  } | null>(null);

  const [foodItems, setFoodItems] = useState<foodItemType[]>(initFoodItems);
  const [newOffset, setOffset] = useState<number | null>(initNewOffset);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const onLoadMore = async () => {
    if (isLoading || !newOffset) return;
    setIsLoading(true);
    try {
      const { foodItems: fetchedItems, newOffset: nextOffset } =
        await getMoreFoodItems(newOffset, undefined, 8);
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

  const chgFoodItem = () => {
    if (currentSelectedIndex === null || currentSelectedItem === null) return;
    const newPrice = inputRef.current?.value ?? currentSelectedItem.finalPrice;

    const finalMassIndex = stagedItem
      ? stagedItem.selectedMassIndex
      : currentSelectedItem.selectedMassIndex;
    const finalInterval = stagedItem
      ? stagedItem.priceInterval
      : currentSelectedItem.priceInterval;
    const finalStep = stagedItem
      ? Number(stagedItem.stepPrice)
      : Number(currentSelectedItem.stepPrice);
    const finalMass = currentSelectedItem.predInfo?.mass[finalMassIndex] || 0;
    const expectedBaselinePrice = (
      Math.ceil(finalMass / finalInterval) * finalStep
    ).toFixed(2);

    // Tag the override securely!
    const isOverride = Number(newPrice).toFixed(2) !== expectedBaselinePrice;

    if (stagedItem) {
      changeFoodItem(currentSelectedIndex, {
        ...stagedItem,
        finalPrice: newPrice,
        isManualOverride: isOverride
      });
    } else {
      changeFoodItem(currentSelectedIndex, {
        selectedMassIndex: currentSelectedItem.selectedMassIndex,
        finalPrice: newPrice,
        activePriceId: currentSelectedItem.activePriceId,
        isManualOverride: isOverride
      });
    }
    setCurrentSelectedIndex(null);
    setStagedItem(null);
  };

  if (isAgnostic) {
    return (
      <div className="relative w-full h-full">
        {labels.map(
          (i, idx) =>
            i.predInfo && (
              <React.Fragment key={idx}>
                <div
                  className={`absolute bg-amber-50 z-10 text-sm text-black`}
                  style={{
                    left: `${i.predInfo.box.x1}`,
                    top: `${i.predInfo.box.y1}`
                  }}
                >
                  {i.name}
                </div>
                <div
                  className={`absolute border-2 border-amber-50 z-10`}
                  style={{
                    left: `${i.predInfo.box.x1}`,
                    top: `${i.predInfo.box.y1}`,
                    width: `${i.predInfo.box.x2 - i.predInfo.box.x1}`,
                    height: `${i.predInfo.box.y2 - i.predInfo.box.y1}`
                  }}
                ></div>
              </React.Fragment>
            )
        )}
        <Image
          src={foodSrc}
          fill
          alt="foodImg"
          className="object-contain z-0"
        />
      </div>
    );
  }
  return (
    <div className="relative" style={{ width: '640px', height: '640px' }}>
      {labels.map(
        (i, idx) =>
          i.predInfo && (
            <Button
              key={idx}
              onClick={() => setCurrentSelectedIndex(idx)}
              className="absolute z-10 border-2 border-amber-50 bg-transparent p-0 cursor-pointer hover:bg-amber-50/20"
              style={{
                left: `${i.predInfo.box.x1}px`,
                top: `${i.predInfo.box.y1}px`,
                width: `${i.predInfo.box.x2 - i.predInfo.box.x1}px`,
                height: `${i.predInfo.box.y2 - i.predInfo.box.y1}px`
              }}
            >
              <div
                className={`absolute bg-amber-50 z-10 text-sm text-black top-0 left-0`}
              >
                {i.name}
              </div>
            </Button>
          )
      )}
      <Image src={foodSrc} fill alt="foodImg" className="object-contain z-0" />
      <Dialog
        open={!!currentSelectedItem}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentSelectedIndex(null);
            setStagedItem(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl w-[95vw]">
          <div className="flex flex-col gap-4 py-4">
            <div className="font-semibold text-lg">
              Edit: {stagedItem ? stagedItem.name : currentSelectedItem?.name}
            </div>
            <FieldGroup className="py-6">
              <Field>
                <Label>Select Food Class</Label>
                <Combobox
                  items={foodItems}
                  itemToStringValue={(i: (typeof foodItems)[number]) => i.name}
                >
                  <ComboboxInput readOnly />
                  <ComboboxContent>
                    <ComboboxList
                      onScroll={(e) => {
                        const target = e.currentTarget;
                        if (
                          target.scrollHeight - target.scrollTop <=
                          target.clientHeight + 10
                        ) {
                          onLoadMore();
                        }
                      }}
                    >
                      {(i: any, idx: number) => (
                        <ComboboxItem
                          key={idx}
                          value={i.name}
                          onClick={() => {
                            setStagedItem({
                              foodId: i.classId,
                              selectedMassIndex: i.classId,
                              name: i.name,
                              stepPrice: i.foodPrices.stepPrice,
                              priceInterval: i.foodPrices.priceInterval,
                              activePriceId: i.activePriceId
                            });
                            // Compute realtime simulated checkout value dynamically.
                            const massVal =
                              currentSelectedItem?.predInfo?.mass[i.classId] ||
                              0;
                            const simulatedBaseline = (
                              Math.ceil(massVal / i.foodPrices.priceInterval) *
                              Number(i.foodPrices.stepPrice)
                            ).toFixed(2);
                            if (inputRef.current) {
                              inputRef.current.value = simulatedBaseline;
                            }
                          }}
                        >
                          <Item size="xs" className="p-0">
                            <ItemContent>
                              <ItemTitle className="whitespace-nowrap">
                                {i.name}
                              </ItemTitle>
                              <ItemDescription>
                                {currentSelectedItem?.predInfo?.mass[
                                  i.classId
                                ] != null
                                  ? `${currentSelectedItem.predInfo.mass[i.classId]}g`
                                  : '-'}
                              </ItemDescription>
                            </ItemContent>
                          </Item>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                    {isLoading && (
                      <div className="py-2 text-center text-sm text-muted-foreground w-full">
                        Loading...
                      </div>
                    )}
                    <ComboboxEmpty>No food items found</ComboboxEmpty>
                  </ComboboxContent>
                </Combobox>
              </Field>
              <Field>
                <Label htmlFor="finalPrice">
                  Price{' '}
                  {currentSelectedItem?.predInfo?.mass
                    ? `(mass: ${currentSelectedItem.predInfo.mass[stagedItem ? stagedItem.selectedMassIndex : currentSelectedItem.selectedMassIndex]}g)`
                    : ''}
                </Label>
                <Input
                  id="finalPrice"
                  name="finalPrice"
                  ref={inputRef}
                  defaultValue={currentSelectedItem?.finalPrice}
                  key={currentSelectedIndex}
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentSelectedIndex(null);
                  setStagedItem(null);
                }}
              >
                Cancel
              </Button>
              <Button type="button" onClick={() => chgFoodItem()}>
                Confirm Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
