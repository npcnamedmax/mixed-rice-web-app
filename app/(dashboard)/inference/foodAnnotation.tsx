'use client';

import Image from 'next/image';
import React, { useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { foodItemType } from '@/lib/db';
import { getMoreFoodItems } from '@/actions/foodActions';
import { Field, FieldGroup } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue
} from '@/components/ui/combobox';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle
} from '@/components/ui/item';
import { Button } from '@/components/ui/button';
import { TransactionItemView } from './inference-module';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

type ComboboxItemType = {
  name: string;
  classId: number;
  finalPrice: number;
  priceInterval: number;
  stepPrice: number;
  activePriceId: number;
};

export function FoodAnnotation({
  foodSrc,
  labels,
  isAgnostic,
  initFoodItems,
  initNewOffset,
  isPredicting,
  changeFoodItem,
  imgOriSize
}: {
  foodSrc: string;
  labels: TransactionItemView[];
  isAgnostic: boolean | null;
  initFoodItems: foodItemType[];
  initNewOffset: number | null;
  isPredicting: boolean;
  changeFoodItem: (
    idx: number,
    item: {
      name: string;
      classId: number;
      finalPrice: number;
      priceInterval: number;
      stepPrice: number;
      activePriceId: number;
    }
  ) => void;
  imgOriSize:
    | {
        width: number;
        height: number;
      }
    | undefined;
}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [stagedItem, setStagedItem] = useState<ComboboxItemType | null>(null);

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

  const setCurrentIdx = (idx: number | null) => {
    setSelectedIdx(idx);
    setStagedItem(
      idx !== null
        ? {
            name: labels[idx].name,
            classId: labels[idx].foodId,
            finalPrice: Number(labels[idx].finalPrice),
            priceInterval: Number(labels[idx].priceInterval ?? 0),
            stepPrice: Number(labels[idx].stepPrice ?? 0),
            activePriceId: Number(labels[idx].activePriceId ?? 0)
          }
        : null
    );
  };

  const chgFoodItem = () => {
    if (!stagedItem || selectedIdx === null) return;
    const currentSelectedItem = labels[selectedIdx];
    const newPrice = inputRef.current?.value;
    if (!newPrice || !currentSelectedItem) return;
    const reg = /\d+(\.\d{0,1,2})?$/;
    if (reg.test(newPrice)) {
      changeFoodItem(selectedIdx, {
        name: stagedItem.name,
        classId: stagedItem.classId,
        finalPrice: Number(newPrice),
        priceInterval: stagedItem.priceInterval,
        stepPrice: stagedItem.stepPrice,
        activePriceId: stagedItem.activePriceId
      });
      setCurrentIdx(null);
    } else toast('Invalid Price Value');
  };

  const width = 640;
  const height = 640;

  const calculateBoxPos = (
    imgOriSize: {
      width: number;
      height: number;
    },
    x1: number,
    x2: number,
    y1: number,
    y2: number
  ): {
    top: string;
    left: string;
    width: string;
    height: string;
  } => {
    const imgWidth = imgOriSize.width;
    const imgHeight = imgOriSize.height;
    let res = { top: 0, left: 0, width: 0, height: 0 };
    if (imgWidth > imgHeight) {
      const newHeight = imgHeight * (width / imgWidth);
      res.top = (height - newHeight) / 2 + (y1 / imgHeight) * newHeight;
      res.left = (x1 / imgWidth) * width;
      res.width = ((x2 - x1) / imgWidth) * width;
      res.height = ((y2 - y1) / imgHeight) * newHeight;
    } else {
      const newWidth = imgWidth * (height / imgHeight);
      res.left = (width - newWidth) / 2 + (x1 / imgWidth) * newWidth;
      res.top = (y1 / imgHeight) * height;
      res.width = ((x2 - x1) / imgWidth) * newWidth;
      res.height = ((y2 - y1) / imgHeight) * height;
    }
    return {
      top: `${res.top}px`,
      left: `${res.left}px`,
      width: `${res.width}px`,
      height: `${res.height}px`
    };
  };

  return (
    <div
      className="relative"
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {imgOriSize &&
        labels.map(
          (i, idx) =>
            i.predInfo &&
            i.itemStatus !== 'VENDOR_REMOVED' && (
              <Button
                key={idx}
                onClick={() => setCurrentIdx(idx)}
                className="absolute z-10 border-2 border-amber-50 bg-transparent p-0 cursor-pointer hover:bg-amber-50/20"
                style={calculateBoxPos(
                  imgOriSize,
                  i.predInfo.box.x1,
                  i.predInfo.box.x2,
                  i.predInfo.box.y1,
                  i.predInfo.box.y2
                )}
              >
                <div
                  className={`absolute bg-amber-50 z-10 text-sm text-black top-0 left-0`}
                >
                  {i.name}
                </div>
              </Button>
            )
        )}{' '}
      {foodSrc !== '' && (
        <Image
          src={foodSrc}
          fill
          alt="foodImg"
          className="object-contain z-0"
        />
      )}
      {isPredicting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none bg-gray-500/50 backdrop-blur-sm">
          <Loader />
        </div>
      )}
      <Dialog
        open={!!stagedItem}
        onOpenChange={(open) => {
          if (!open) {
            setCurrentIdx(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl w-[95vw]">
          <div className="flex flex-col gap-4 py-4">
            <div className="font-semibold text-lg">
              Edit: {stagedItem?.name}
            </div>
            <FieldGroup className="py-6">
              <Field>
                <Label>Select Food Class</Label>
                <Combobox
                  items={foodItems.map<ComboboxItemType>((i) => {
                    const massVal =
                      selectedIdx !== null &&
                      labels[selectedIdx]?.predInfo?.mass
                        ? Number(
                            labels[selectedIdx].predInfo.mass[
                              isAgnostic ? 0 : i.classId
                            ] ?? 0
                          )
                        : 0;

                    const interval = i.foodPrices.priceInterval;
                    const step = i.foodPrices.stepPrice;

                    const calculatedPrice = (
                      Math.ceil(massVal / interval) * Number(step)
                    ).toFixed(2);

                    return {
                      name: i.name,
                      finalPrice: Number(calculatedPrice),
                      classId: i.classId,
                      activePriceId: i.activePriceId,
                      priceInterval: interval,
                      stepPrice: Number(step)
                    };
                  })}
                  itemToStringLabel={(i: ComboboxItemType | null) =>
                    i?.name
                      ? i.name.charAt(0).toUpperCase() + i.name.slice(1)
                      : ''
                  }
                  value={stagedItem}
                  onValueChange={(i) => {
                    if (!i) return;
                    setStagedItem(i);
                    if (inputRef.current) {
                      inputRef.current.value = i.finalPrice.toFixed(2);
                    }
                  }}
                  disabled={!!isAgnostic}
                >
                  <ComboboxTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-64 justify-between font-normal"
                      >
                        <ComboboxValue />
                      </Button>
                    }
                  />
                  <ComboboxContent>
                    <ComboboxInput
                      showTrigger={false}
                      value={''}
                      className="hidden"
                    />
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
                          value={i}
                          style={
                            stagedItem && stagedItem.classId === i.classId
                              ? { backgroundColor: '#95b4dfff' }
                              : {}
                          }
                        >
                          <Item size="xs" className="p-0">
                            <ItemContent>
                              <ItemTitle className="whitespace-nowrap">
                                {i.name.charAt(0).toUpperCase() +
                                  i.name.slice(1)}
                              </ItemTitle>
                              <ItemDescription>
                                {selectedIdx !== null &&
                                labels[selectedIdx].predInfo?.mass?.[
                                  isAgnostic ? 0 : i.classId
                                ]
                                  ? `${labels[selectedIdx].predInfo.mass[isAgnostic ? 0 : i.classId]}g`
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
                  {stagedItem &&
                  selectedIdx !== null &&
                  labels[selectedIdx].predInfo?.mass?.[
                    isAgnostic ? 0 : stagedItem.classId
                  ]
                    ? `(mass: ${labels[selectedIdx].predInfo.mass[isAgnostic ? 0 : stagedItem.classId]}g)`
                    : ''}
                </Label>
                <Input
                  id="finalPrice"
                  name="finalPrice"
                  ref={inputRef}
                  key={selectedIdx}
                  defaultValue={stagedItem?.finalPrice}
                />
              </Field>
            </FieldGroup>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentIdx(null);
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
