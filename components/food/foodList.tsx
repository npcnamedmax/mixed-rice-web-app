'use client';

import React, { useEffect, useRef } from 'react';
import { foodItemType } from '@/lib/db';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader
} from '@/components/ui/card';
import Image from 'next/image';

import { Loader, Search } from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export function FoodList({
  foodItems,
  onSelectFood,
  onLoadMore,
  isLoading = false,
  onSearch,
  searchTerm,
  ...props
}: {
  foodItems: foodItemType[];
  onSelectFood: (f: foodItemType) => any;
  onLoadMore?: () => any | undefined;
  isLoading?: boolean;
  onSearch: (s: string) => any;
  searchTerm?: string | undefined;
} & React.ComponentProps<typeof Card>) {
  const { ref, inView } = useInView();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inView && onLoadMore) {
      onLoadMore();
    }
  }, [inView, onLoadMore]);

  const submitSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputRef.current?.value ?? '';
    try {
      onSearch(val);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card {...props} className="flex-1 flex-row">
      <CardHeader>
        <form
          onSubmit={submitSearch}
          className="relative ml-auto flex-1 md:grow-0"
        >
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-50 lg:w-84"
            ref={inputRef}
            defaultValue={searchTerm ?? ''}
          />
        </form>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {foodItems.map((i: foodItemType) => (
              <Card
                key={i.id}
                onClick={() => onSelectFood(i)}
                className="cursor-pointer overflow-hidden transition-colors hover:bg-accent hover:text-accent-foreground active:scale-[0.98]"
              >
                <CardContent className="flex flex-col items-center justify-center p-4">
                  <Image
                    alt={i.name || 'Product image'}
                    className="aspect-square rounded-md object-cover"
                    height={200}
                    width={200}
                    src={
                      i.imageUrl ||
                      'https://t4.ftcdn.net/jpg/06/71/92/37/360_F_671923740_x0zOL3OIuUAnSF6sr7PuznCI5bQFKhI0.jpg'
                    }
                  />
                </CardContent>
                <CardFooter className="flex justify-center p-3 pt-0 text-center text-sm font-medium">
                  {i.name}
                </CardFooter>
              </Card>
            ))}
          </div>
          <div ref={ref} className="flex justify-center p-4">
            {!isLoading && <span className="text-transparent">trigger</span>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center items-center">
        {isLoading && <Loader />}
      </CardFooter>
    </Card>
  );
}
