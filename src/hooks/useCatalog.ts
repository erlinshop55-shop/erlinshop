'use client';
import { useState, useMemo } from 'react';

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'featured';

export interface UseCatalogProps<T> {
  readonly initialProducts: readonly T[];
  readonly initialCategories: readonly { id: string; name: string }[];
  readonly initialCategory?: string | null;
  readonly initialGender?: string | null;
}

export function useCatalog<T extends { 
  id: string; 
  name: string; 
  price: number; 
  categoryId: string | null;
  isNew: boolean | null;
  isFeatured: boolean | null;
  genderTarget: string | null;
  brand: string | null;
  createdAt: Date;
}>({ 
  initialProducts, 
  initialCategories,
  initialCategory = null,
  initialGender = null
}: UseCatalogProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedGender, setSelectedGender] = useState<string | null>(initialGender);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000000]); // in cents

  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
        const matchesGender = !selectedGender || p.genderTarget === selectedGender;
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        return matchesSearch && matchesCategory && matchesGender && matchesPrice;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'featured':
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return 0;
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });
  }, [initialProducts, searchQuery, selectedCategory, selectedGender, sortBy, priceRange]);

  return {
    products: filteredProducts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    selectedGender,
    setSelectedGender,
    priceRange,
    setPriceRange,
    categories: initialCategories,
  };
}
