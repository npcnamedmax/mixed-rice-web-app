'use client';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { foodItemType } from '@/lib/db';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table
} from '@/components/ui/table';
import { useState, useEffect, useMemo } from 'react';
import { InsertTransactionitems, ModelEnumType, modelType } from '@/lib/schema';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Camera, Upload } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFileUpload } from '@/hooks/use-file-upload';

import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { FoodItemAddModule } from './add-food-module';
import {
  getPrediction,
  saveTransactionToDb,
  PredResponseType
} from '@/actions/inferenceActions';
import { FoodAnnotation } from './foodAnnotation';

export const dynamic = 'force-dynamic';

export type TransactionItemView = Omit<InsertTransactionitems, 'totalMass'> & {
  activePriceId: number;
  isAgnostic: boolean | null;
  name: string;
  finalPrice: string;
  predInfo?: PredResponseType | undefined;
  stepPrice: string;
  priceInterval: number;
}; //mass follows cls id and can be chged

export type GroupItemView = {
  foodId: number;
  name: string;
  finalPrice: number;
  itemStatus: TransactionItemView['itemStatus'];
  stepPrice: number;
  priceInterval: number;
  totalMass: number | null;
  activePriceId: number;
};

export default function InferenceModule({
  initialFoodItems,
  initialOffset
}: {
  initialFoodItems: foodItemType[];
  initialOffset: number | null;
}) {
  const [pred, chgPred] = useState<TransactionItemView[]>([]);
  const [currentItems, chgItems] = useState<TransactionItemView[]>([]);
  const [afterReset, setAfterReset] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedModel, chgModel] = useState<ModelEnumType>(
    modelType.enumValues[0]
  );
  const [priceOverride, setPriceOverride] = useState<Record<number, number>>(
    {}
  );
  const [{ files }, { openFileDialog, getInputProps, clearFiles }] =
    useFileUpload({
      accept: '.jpg,.jpeg,.png',
      multiple: false,
      maxFiles: 1,
      maxSize: 49e6 //49mb
    });

  const addItem = (f: TransactionItemView) => {
    //itemStatus set in dialog
    chgItems((prev) => {
      const exists = prev.some(
        (i) => i.foodId === f.foodId && i.itemStatus !== 'VENDOR_REMOVED'
      );

      if (exists) {
        return prev;
      }
      return [...prev, f];
    });
    setIsAddModalOpen(false);
  };

  const handlePriceOverride = (foodId: number, newPrice: number) => {
    setPriceOverride((prev) => ({ ...prev, [foodId]: newPrice }));
  };

  const changeFoodItem = (
    idx: number,
    updated: {
      name: string;
      classId: number;
      finalPrice: number;
      priceInterval: number;
      stepPrice: number;
      activePriceId: number;
    }
  ) => {
    chgItems((prev) => {
      const newItems = [...prev];
      newItems[idx] = {
        ...newItems[idx],
        foodId: updated.classId,
        finalPrice: updated.finalPrice.toString(),
        activePriceId: updated.activePriceId,
        stepPrice: updated.stepPrice.toString(),
        priceInterval: updated.priceInterval,
        name: updated.name
      };
      return newItems;
    });
    setPriceOverride((prev) => {
      const newOverrides = { ...prev };
      delete newOverrides[updated.classId];
      return newOverrides;
    });
  };

  const predict = async () => {
    if (!afterReset) reset();
    //get pred
    const file = files[0].file;

    const formData = new FormData();
    let fileName = '';
    if (file instanceof File) {
      fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
      formData.append('file', file);
    } else {
      console.error('The uploaded item is not a valid File object');
      alert('The uploaded item is not a valid File object');
      return;
    }
    formData.append('fileName', fileName);
    setIsPredicting(true);
    try {
      const predictionResults = await getPrediction(formData, selectedModel);

      if (predictionResults === null)
        throw new Error('Prediction returned null');
      chgItems(predictionResults);
      chgPred(predictionResults);
      console.log('Predictions:', predictionResults);
    } catch (err) {
      console.error('Prediction failed:', err);
      alert('Prediction failed. Please check the logs or try again later.');
    } finally {
      setFileName(fileName);
      setIsPredicting(false);
      setAfterReset(false);
    }
  };

  const reset = () => {
    chgItems([]);
    setFileName(null);
    setAfterReset(true);
    setPriceOverride({});
  };

  const currentFile = files[0]?.file;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentFile && currentFile instanceof File) {
      const url = URL.createObjectURL(currentFile);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    setObjectUrl(null);
  }, [currentFile]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const removeClassGroup = (foodId: number) => {
    chgItems((prev) =>
      prev.map((ff) =>
        foodId === ff.foodId
          ? { ...ff, itemStatus: 'VENDOR_REMOVED' as const }
          : ff
      )
    );
  };

  const activeItems = currentItems.filter(
    (t) => t.itemStatus !== 'VENDOR_REMOVED'
  );

  const groupedItems: GroupItemView[] = Object.values(
    activeItems.reduce(
      (acc, item) => {
        //group same cls tgt to get total mass n price
        let totalMass = null;
        if (item.predInfo) {
          if (item.isAgnostic) totalMass = item.predInfo.mass[0];
          else totalMass = item.predInfo.mass[item.foodId];
        }
        if (!acc[item.foodId]) {
          acc[item.foodId] = {
            foodId: item.foodId,
            name: item.name,
            stepPrice: Number(item.stepPrice),
            priceInterval: Number(item.priceInterval),
            totalMass,
            activePriceId: item.activePriceId,
            itemStatus: item.itemStatus,
            finalPrice: Number(item.finalPrice)
          };
        } else {
          if (item.predInfo) {
            if (acc[item.foodId].totalMass === null) {
              acc[item.foodId].totalMass = 0;
            }
            if (item.isAgnostic)
              acc[item.foodId].totalMass += Number(item.predInfo?.mass[0] ?? 0);
            else
              acc[item.foodId].totalMass += Number(
                item.predInfo?.mass[item.foodId] ?? 0
              );
          }
          acc[item.foodId].finalPrice += Number(item.finalPrice);
        }

        return acc;
      },
      {} as Record<number, any>
    )
  ).map((group: any) => ({
    ...group,
    finalPrice:
      priceOverride[group.foodId] !== undefined
        ? priceOverride[group.foodId]
        : group.finalPrice
  }));

  const submitTransaction = async () => {
    //only choose one mass if applicable
    if (currentItems.length === 0 || fileName === null) return;
    try {
      const removedGroup = currentItems
        .filter((t) => t.itemStatus === 'VENDOR_REMOVED')
        .reduce(
          (acc, item) => {
            //group same cls tgt to get total mass n price
            let totalMass = null;
            if (item.predInfo) {
              if (item.isAgnostic) totalMass = item.predInfo.mass[0];
              else totalMass = item.predInfo.mass[item.foodId];
            }
            if (!acc[item.foodId]) {
              acc[item.foodId] = {
                foodId: item.foodId,
                name: item.name,
                stepPrice: Number(item.stepPrice),
                priceInterval: Number(item.priceInterval),
                totalMass,
                activePriceId: item.activePriceId,
                itemStatus: item.itemStatus,
                finalPrice: Number(item.finalPrice)
              };
            } else {
              if (item.predInfo) {
                if (acc[item.foodId].totalMass === null) {
                  acc[item.foodId].totalMass = 0;
                }
                if (item.isAgnostic)
                  acc[item.foodId].totalMass += Number(
                    item.predInfo?.mass[0] ?? 0
                  );
                else
                  acc[item.foodId].totalMass += Number(
                    item.predInfo?.mass[item.foodId] ?? 0
                  );
              }
              acc[item.foodId].finalPrice += Number(item.finalPrice);
            }

            return acc;
          },
          {} as Record<number, any>
        );
      await saveTransactionToDb(
        [...groupedItems, ...Object.values(removedGroup)],
        fileName,
        selectedModel
      );
      clearFiles();
      reset(); // Clear the board after success
      alert('Transaction Saved!');
    } catch (err) {
      console.error('Failed to save transaction', err);
    }
  };

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger className="flex items-center border-primary/20 hover:bg-primary/5 font-semibold shadow-md transition-all gap-2 px-4 py-2 rounded-md cursor-pointer">
              <PlusCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Add Food Item</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl w-[95vw]">
              <DialogHeader>
                <DialogTitle>Select Food to Add</DialogTitle>
              </DialogHeader>
              <FoodItemAddModule
                addFoodItem={addItem}
                initFoodItems={initialFoodItems}
                initNewOffset={initialOffset}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex flex-row gap-4">
          <ToggleGroup
            defaultValue={[modelType.enumValues[0]]}
            variant="outline"
            onValueChange={(i) => {
              if (i.length) chgModel(i[0] as ModelEnumType);
            }}
            value={[selectedModel]}
          >
            {modelType.enumValues.map((i) => (
              <ToggleGroupItem key={i} value={i}>
                {i}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <input {...getInputProps()} className="hidden" />
          <Button
            onClick={openFileDialog}
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/5"
          >
            <Upload className="w-4 h-4" />
            {files.length > 0 ? 'Change Photo' : 'Select Photo'}
          </Button>
          <Button
            onClick={predict}
            disabled={files.length === 0 || isPredicting}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all"
          >
            <Camera className="w-4 h-4" />
            {isPredicting ? 'Running Model...' : 'Run Prediction'}
          </Button>
          <Button
            variant="ghost"
            disabled={pred.length === 0 || isPredicting}
            onClick={() => chgItems(pred)}
          >
            Reset
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card className="w-full min-h-[85vh] border rounded-2xl shadow-xl bg-card overflow-hidden">
          <CardContent className="p-6 h-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 h-full">
              <Card
                className="col-span-1 md:col-span-7 flex flex-col items-center justify-center overflow-hidden bg-muted/30 border-muted rounded-xl shadow-inner relative"
                style={{ minHeight: '640px' }}
              >
                {files.length > 0 ? (
                  <FoodAnnotation
                    foodSrc={objectUrl || ''}
                    labels={currentItems}
                    isAgnostic={currentItems[0]?.isAgnostic ?? true}
                    initFoodItems={initialFoodItems}
                    initNewOffset={initialOffset}
                    isPredicting={isPredicting}
                    changeFoodItem={changeFoodItem}
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    Upload a photo and run prediction to see results
                  </div>
                )}
              </Card>

              <div className="col-span-1 md:col-span-5 flex flex-col gap-6 h-full relative">
                <Card className="w-full flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm border-primary/10 bg-card rounded-xl">
                  <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
                    <CardTitle className="text-xl font-bold tracking-tight">
                      Checkout Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-y-auto flex-1 p-0">
                    <Table>
                      <TableHeader className="sticky top-0 bg-muted/30 z-10 backdrop-blur-sm">
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">
                            Rate
                          </TableHead>
                          <TableHead className="hidden md:table-cell w-20">
                            Mass
                          </TableHead>
                          <TableHead className="text-right w-24">
                            Price
                          </TableHead>
                          <TableHead className="w-10 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupedItems.map((g, i: number) => (
                          <TableRow key={g.foodId}>
                            <TableCell className="font-semibold capitalize text-foreground/90">
                              {g.name}
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-muted-foreground text-xs font-mono">
                              ${Number(g.stepPrice).toFixed(2)}/
                              {g.priceInterval}g
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-foreground/80 font-medium">
                              {g.totalMass && g.totalMass > 0
                                ? `${g.totalMass.toFixed(1)}g`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end font-mono font-bold text-primary">
                                $
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault(); // Prevents the page from reloading
                                    // Grab the value from the input using its name attribute
                                    const formInput =
                                      e.currentTarget.elements.namedItem(
                                        'overrideInput'
                                      ) as HTMLInputElement;

                                    handlePriceOverride(
                                      g.foodId,
                                      Number(formInput.value)
                                    );
                                    formInput.blur(); // Optional: removes focus from the input after pressing Enter
                                  }}
                                >
                                  <input
                                    name="overrideInput"
                                    className="w-16 ml-1 p-1 text-right bg-transparent border-b border-primary/20 focus:border-primary focus:outline-none transition-colors [&::-webkit-inner-spin-button]:appearance-none"
                                    defaultValue={
                                      priceOverride[g.foodId] !== undefined
                                        ? priceOverride[g.foodId]
                                        : g.finalPrice.toFixed(2)
                                    }
                                    min="0"
                                    step="0.01"
                                  />
                                </form>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive opacity-70 hover:opacity-100 hover:bg-destructive/10 transition-colors"
                                onClick={() => removeClassGroup(g.foodId)}
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="w-full bg-linear-to-br from-primary/5 to-primary/10 border-primary/20 shrink-0 shadow-md rounded-xl mt-auto">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Total Amount
                      </span>
                      <span className="text-3xl font-mono font-extrabold text-primary drop-shadow-sm">
                        $
                        {groupedItems
                          .reduce((total, group) => {
                            const groupCost = Number(group.finalPrice);
                            return total + (groupCost || 0);
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <Button
                      size="lg"
                      className="px-8 text-lg shadow-lg font-bold bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      disabled={
                        currentItems.filter(
                          (t) => t.itemStatus !== 'VENDOR_REMOVED'
                        ).length === 0
                      }
                      onClick={submitTransaction}
                    >
                      Complete Transaction
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
