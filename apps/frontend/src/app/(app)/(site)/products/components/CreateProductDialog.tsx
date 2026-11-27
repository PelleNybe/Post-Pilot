'use client';

import { useState } from 'react';
import { Button } from '@postpilot/react/form/button';
import { Input } from '@postpilot/react/form/input';
import { Textarea } from '@postpilot/react/form/textarea';
import { useToaster } from '@postpilot/react/toaster/toaster';
import { useFetch } from '@postpilot/helpers/utils/custom.fetch';
import { ModalWrapperComponent } from '@postpilot/frontend/components/new-launch/modal.wrapper.component';
import { useSWRConfig } from 'swr';
import { FormProvider, useForm } from 'react-hook-form';

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const fetch = useFetch();
  const toaster = useToaster();
  const { mutate } = useSWRConfig();

  const methods = useForm({
    defaultValues: {
      name: '',
      description: '',
      price: '',
      url: '',
      imageUrl: '',
    }
  });

  const onSubmit = async (data: any) => {
    setLoading(true);

    const payload = {
      name: data.name,
      description: data.description,
      price: data.price ? Number(data.price) : undefined,
      url: data.url,
      imageUrl: data.imageUrl,
      source: 'MANUAL',
    };

    try {
      await fetch('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toaster.show('Product created successfully', 'success');
      mutate('/products');
      setOpen(false);
      methods.reset();
    } catch (error) {
      toaster.show('Failed to create product', 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <span>Add Product</span>
      </Button>
      {open && (
        <ModalWrapperComponent title="Add New Product" customClose={() => setOpen(false)} ask={false}>
          <div className="w-[500px] max-w-full p-6 bg-white dark:bg-gray-900 rounded-lg shadow-xl">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Add New Product</h2>
              <p className="text-sm text-gray-500">Add a new product to your e-commerce catalog.</p>
            </div>
            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
                <Input name="name" label="Product Name" placeholder="Super Widget 3000" />
                <Textarea name="description" label="Description" placeholder="A great widget..." />
                <Input name="price" type="number" step="0.01" label="Price ($)" placeholder="29.99" />
                <Input name="url" type="url" label="Product Link URL" placeholder="https://store.com/widget" />
                <Input name="imageUrl" type="url" label="Image URL" placeholder="https://store.com/widget.jpg" />

                <div className="flex justify-end gap-2 mt-6">
                  <Button type="button" secondary onClick={() => setOpen(false)} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Product'}
                  </Button>
                </div>
              </form>
            </FormProvider>
          </div>
        </ModalWrapperComponent>
      )}
    </>
  );
}
