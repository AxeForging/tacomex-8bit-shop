import { useState, useEffect, useCallback } from 'react';
import { Product, Category } from '../types';
import { productsApi, categoriesApi, transformProduct, transformCategory } from '../services/api';

interface UseProductsParams {
  category?: string;
  search?: string;
  spiceLevel?: number;
  featured?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useProducts = (params?: UseProductsParams): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await productsApi.getAll(params);
      const raw = response.data.products || response.data.data || response.data || [];
      setProducts(Array.isArray(raw) ? raw.map(transformProduct) : []);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error fetching products:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params?.category, params?.search, params?.spiceLevel, params?.featured]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
};

export const useProduct = (id: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await productsApi.getById(id);
        const raw = response.data.product || response.data.data || response.data;
        setProduct(raw ? transformProduct(raw) : null);
      } catch (err) {
        setError('Failed to load product');
        console.error('Error fetching product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, isLoading, error };
};

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await categoriesApi.getAll();
      const raw = response.data.categories || response.data.data || response.data || [];
      setCategories(Array.isArray(raw) ? raw.map(transformCategory) : []);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, refetch: fetchCategories };
};

export const useFeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await productsApi.getFeatured();
        const raw = response.data.products || response.data.data || response.data || [];
        setProducts(Array.isArray(raw) ? raw.map(transformProduct) : []);
      } catch (err) {
        setError('Failed to load featured products');
        console.error('Error fetching featured products:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return { products, isLoading, error };
};
