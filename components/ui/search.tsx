'use client';

import { FormEvent, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchQuery = formData.get('q');

    const params = new URLSearchParams(searchParams.toString());

    if (searchQuery) {
      params.set('q', searchQuery as string);
    } else {
      params.delete('q');
    }

    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <form onSubmit={handleSearch} className="relative ml-auto flex-1 md:grow-0">
      <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        placeholder="Search..."
        className="w-full rounded-lg bg-background pl-8 md:w-50 lg:w-84"
        ref={inputRef}
      />
    </form>
  );
}
