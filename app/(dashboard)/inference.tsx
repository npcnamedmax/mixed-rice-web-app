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
import { foodItemType, TransactionTypeWithDetail } from '@/lib/db';
import { useEffect, useState } from 'react';
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

/* function Annotation({}) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [foodItems, setFoodItems] = useState<foodItemType[]>(initFoodItems);
  const [newOffset, setOffset] = useState<number | null>(initNewOffset);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="relative" style={{ width: '640px', height: '640px' }}>
      {labels.map(
        (i, idx) =>
          i.predInfo &&
          i.itemStatus !== 'VENDOR_REMOVED' && (
            <Button
              key={idx}
              onClick={() => setCurrentIdx(idx)}
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
} */

export function InferenceScreen({
  transaction
}: {
  transaction: TransactionTypeWithDetail;
}) {
  useEffect(() => console.log(transaction.transactionItems[0]));
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
                            {t.totalMass ? `${t.totalMass}g` : '-'}
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
                            {t.totalMass ? `${t.totalMass}g` : '-'}
                            {t.totalMass ? `${t.totalMass}g` : '-'}
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
