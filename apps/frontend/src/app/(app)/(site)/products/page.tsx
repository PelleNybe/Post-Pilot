import { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductsList } from './components/ProductsList';
import { CreateProductDialog } from './components/CreateProductDialog';


export const metadata: Metadata = {
  title: 'Products',
};

export default function ProductsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your e-commerce products for tracking and automated posting.</p>
        </div>
        <CreateProductDialog />
      </div>

      <Suspense fallback={<div>Loading products...</div>}>
        <ProductsList />
      </Suspense>
    </div>
  );
}
