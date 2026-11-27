'use client';

import useSWR from 'swr';
import Image from 'next/image';
import { useFetch } from '@postpilot/helpers/utils/custom.fetch';
import { Button } from '@postpilot/react/form/button';
import { useToaster } from '@postpilot/react/toaster/toaster';

export function ProductsList() {
  const fetch = useFetch();
  const toaster = useToaster();

  const { data: products, mutate, error } = useSWR('/products', async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await fetch(`/products/${id}`, { method: 'DELETE' });
      mutate();
      toaster.show('Product deleted', 'success');
    } catch (e) {
      toaster.show('Failed to delete product', 'warning');
    }
  };

  if (error) return <div className="text-red-500">Error loading products.</div>;
  if (!products) return <div>Loading products...</div>;

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-medium">No products found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Add your first e-commerce product to start tracking and auto-posting.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product: any) => (
        <div key={product.id} className="flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 shadow-sm transition-all hover:shadow-md">
          {product.imageUrl && (
            <div className="h-48 w-full relative bg-gray-100 dark:bg-gray-800">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            </div>
          )}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-lg line-clamp-1 truncate pr-4" title={product.name}>{product.name}</h3>
              {product.price && <span className="font-medium text-green-600 shrink-0">${product.price.toFixed(2)}</span>}
            </div>
            {product.description && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 line-clamp-2 flex-1">{product.description}</p>
            )}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-md text-gray-600 dark:text-gray-300">
                {product.source || 'MANUAL'}
              </span>
              <div className="flex gap-2">
                <a href={product.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                  View Link
                </a>
                <button aria-label="Delete Product"
                  onClick={() => handleDelete(product.id)}
                  className="text-red-500 hover:text-red-600 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
