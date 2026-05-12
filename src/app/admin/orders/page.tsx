import { getAdminOrders } from "@/app/actions/orders";
import OrderList from "./OrderList";

export default async function OrdersPage() {
  const res = await getAdminOrders();

  if (!res.success) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-rose-600">Error Loading Orders</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{res.error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end pb-6 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="text-4xl font-black bg-linear-to-br from-[#B28D27] via-[#D4AF37] to-[#F9D976] bg-clip-text text-transparent tracking-tighter uppercase leading-none">
            Order Management
          </h1>
          <p className="bg-linear-to-r from-[#B28D27] to-[#F9D976] bg-clip-text text-transparent mt-2 text-[10px] font-black uppercase tracking-[0.3em]">
            Track and manage customer checkout intents.
          </p>
        </div>
      </div>

      <OrderList initialOrders={res.data || []} />
    </div>
  );
}
