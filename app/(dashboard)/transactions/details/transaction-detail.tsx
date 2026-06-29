'use client';
import NextImage from 'next/image';
import { useState, useEffect } from 'react';
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
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { TransactionTypeWithDetail } from '@/lib/db';
import { PredResponseType } from '@/actions/inferenceActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function TransactionDetailView({
  transaction,
  imageUrl,
  predictions,
  isAgnostic,
  classIdNameMap
}: {
  transaction: TransactionTypeWithDetail;
  imageUrl: string | null;
  predictions: PredResponseType[] | null;
  isAgnostic: boolean;
  classIdNameMap: Record<number, string>;
}) {
  const [selectedPredIdx, setSelectedPredIdx] = useState<number | null>(null);
  const [imgOriSize, setImgOriSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // Load original image dimensions using a plain Image object
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      setImgOriSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  const activeItems = transaction.transactionItems.filter(
    (t) => t.itemStatus === 'PREDICTED_ITEM' || t.itemStatus === 'VENDOR_ADDED'
  );
  const removedItems = transaction.transactionItems.filter(
    (t) => t.itemStatus === 'VENDOR_REMOVED'
  );

  const selectedPred =
    selectedPredIdx !== null && predictions
      ? predictions[selectedPredIdx]
      : null;

  // Fit-to-image container: max 640px on longest side, aspect ratio preserved
  const maxDim = 640;
  let containerWidth = maxDim;
  let containerHeight = maxDim;

  if (imgOriSize) {
    if (imgOriSize.width > imgOriSize.height) {
      containerWidth = maxDim;
      containerHeight = Math.round(
        (imgOriSize.height / imgOriSize.width) * maxDim
      );
    } else {
      containerHeight = maxDim;
      containerWidth = Math.round(
        (imgOriSize.width / imgOriSize.height) * maxDim
      );
    }
  }

  // Simple scaling — no letterbox offset needed since container matches aspect ratio
  const calculateBoxPos = (
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
    if (!imgOriSize) return { top: '0', left: '0', width: '0', height: '0' };
    return {
      left: `${(x1 / imgOriSize.width) * containerWidth}px`,
      top: `${(y1 / imgOriSize.height) * containerHeight}px`,
      width: `${((x2 - x1) / imgOriSize.width) * containerWidth}px`,
      height: `${((y2 - y1) / imgOriSize.height) * containerHeight}px`
    };
  };

  return (
    <Card className="w-full border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Image with bounding boxes — sticky */}
          <div className="col-span-1 md:col-span-7">
            <div className="sticky top-4">
              <Card className="inline-flex items-center justify-center overflow-hidden bg-muted/30 border-muted rounded-xl shadow-inner">
                {imageUrl ? (
                  <div
                    className="relative"
                    style={{
                      width: `${containerWidth}px`,
                      height: `${containerHeight}px`
                    }}
                  >
                    {imgOriSize &&
                      predictions &&
                      predictions.map((pred, idx) => (
                        <Button
                          key={idx}
                          onClick={() => setSelectedPredIdx(idx)}
                          className={`absolute z-10 border-2 bg-transparent p-0 cursor-pointer hover:bg-amber-50/20 ${selectedPredIdx === idx
                            ? 'border-amber-400 bg-amber-400/15'
                            : 'border-amber-50'
                            }`}
                          style={calculateBoxPos(
                            pred.box.x1,
                            pred.box.x2,
                            pred.box.y1,
                            pred.box.y2
                          )}
                        >
                          <div className="absolute bg-amber-50 z-10 text-sm text-black top-0 left-0">
                            {pred.name}
                          </div>
                        </Button>
                      ))}
                    <NextImage
                      src={imageUrl}
                      fill
                      alt="Transaction image"
                      className="object-contain z-0"
                      onClick={() => setSelectedPredIdx(null)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 w-full text-muted-foreground">
                    No image available for this transaction
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Right: Details */}
          <div className="col-span-1 md:col-span-5 flex flex-col gap-4">
            {/* Transaction info header */}
            <Card className="w-full shrink-0">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Transaction #{transaction.id}
                  </CardTitle>
                  {transaction.status && (
                    <Badge
                      variant="outline"
                      className={`capitalize ${transaction.status === 'APPROVED'
                        ? 'border-green-500/50 text-green-600 bg-green-50'
                        : transaction.status === 'REJECTED'
                          ? 'border-red-500/50 text-red-600 bg-red-50'
                          : 'border-yellow-500/50 text-yellow-600 bg-yellow-50'
                        }`}
                    >
                      {transaction.status.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground space-y-1">
                <div>
                  <span className="font-medium text-foreground">Model:</span>{' '}
                  {transaction.model_type ?? 'N/A'}
                </div>
                <div>
                  <span className="font-medium text-foreground">Date:</span>{' '}
                  {transaction.createdAt.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            {/* Predictions from JSON — shows all or single selected */}
            {predictions && predictions.length > 0 && (
              <Card className="w-full flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {selectedPred ? 'Selected Item' : 'Predicted Items'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto flex-1 px-6 pb-4">
                  {selectedPred ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize text-lg">
                          {selectedPred.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="font-mono text-xs"
                        >
                          {(selectedPred.confidence * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Food Item</TableHead>
                            <TableHead className="text-right">
                              Mass (g)
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isAgnostic ? (
                            <TableRow>
                              <TableCell className="font-medium capitalize">
                                {selectedPred.name}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {selectedPred.mass[0]?.toFixed(2)}g
                              </TableCell>
                            </TableRow>
                          ) : (
                            <>
                              {/* Predicted class row first */}
                              {selectedPred.mass[selectedPred.class] > 0 && (
                                <TableRow className="bg-primary/10">
                                  <TableCell className="capitalize font-bold text-primary">
                                    {classIdNameMap[selectedPred.class] ?? `Class ${selectedPred.class}`}
                                  </TableCell>
                                  <TableCell className="text-right font-mono font-bold text-primary">
                                    {selectedPred.mass[selectedPred.class].toFixed(2)}g
                                  </TableCell>
                                </TableRow>
                              )}
                              {/* Remaining masses */}
                              {selectedPred.mass.map((m, mIdx) =>
                                m > 0 && mIdx !== selectedPred.class ? (
                                  <TableRow key={mIdx}>
                                    <TableCell className="capitalize text-muted-foreground">
                                      {classIdNameMap[mIdx] ?? `Class ${mIdx}`}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-muted-foreground">
                                      {m.toFixed(2)}g
                                    </TableCell>
                                  </TableRow>
                                ) : null
                              )}
                            </>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead className="text-right">
                            {isAgnostic ? 'Mass' : 'Masses'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {predictions.map((pred, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium capitalize">
                              {pred.name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="font-mono text-xs"
                              >
                                {(pred.confidence * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {isAgnostic ? (
                                <span>{pred.mass[0]?.toFixed(2)}g</span>
                              ) : (
                                <div className="flex flex-col items-end gap-0.5">
                                  {pred.mass.map((m, mIdx) =>
                                    m > 0 ? (
                                      <span
                                        key={mIdx}
                                        className={`${mIdx === pred.class
                                          ? 'font-bold text-primary text-lg'
                                          : 'text-sm text-muted-foreground'
                                          }`}
                                      >
                                        {classIdNameMap[mIdx] ?? `Class ${mIdx}`}
                                        : {m.toFixed(2)}g

                                      </span>
                                    ) : null
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Transacted items (from DB) */}
            <Card className="w-full flex flex-col min-h-0 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Transacted Items</CardTitle>
              </CardHeader>
              <CardContent className="overflow-y-auto flex-1 px-6 pb-4">
                <Table>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Rate
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Mass
                      </TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeItems.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium capitalize">
                          {t.foodItem.name}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          ${t.foodPrice.stepPrice}/{t.foodPrice.priceInterval}g
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

            {/* False Positives */}
            {removedItems.length > 0 && (
              <Card className="w-full flex flex-col min-h-0 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">False Positives</CardTitle>
                </CardHeader>
                <CardContent className="overflow-y-auto flex-1 px-6 pb-4">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Mass</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {removedItems.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium capitalize">
                            {t.foodItem.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {t.totalMass ? `${t.totalMass}g` : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Total */}
            <Card className="w-full bg-primary/5 border-primary/20 shrink-0">
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
