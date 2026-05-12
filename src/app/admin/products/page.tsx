import { getProducts } from "./actions";
import { getCategories } from "../categories/actions";
import ProductClient from "./ProductClient";

export default async function ProductsPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly page?: string; readonly limit?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const [productsRes, categoriesRes] = await Promise.all([
    getProducts(page, limit),
    getCategories()
  ]);
  
  if (!productsRes.success || !categoriesRes.success) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-rose-600">Error Loading Data</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          {productsRes.error || categoriesRes.error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-4xl font-black bg-linear-to-br from-[#B28D27] via-[#D4AF37] to-[#F9D976] bg-clip-text text-transparent tracking-tighter uppercase leading-none">
            Manage Products
          </h1>
          <p className="bg-linear-to-r from-[#B28D27] to-[#F9D976] bg-clip-text text-transparent mt-2 text-[10px] font-black uppercase tracking-[0.3em]">
            Add, edit, and manage your luxury inventory here.
          </p>
        </div>
      </div>

      <ProductClient 
        initialData={productsRes.data!} 
        categories={categoriesRes.data || []} 
      />
    </div>
  );
}
