// 📁 File Target: d:\Erlinshop\src\app\admin\orders\OrderList.tsx
// 🎯 Purpose: Pengelolaan data pesanan admin dengan list-modal view, verifikasi transfer manual, dan FSM transition (Zalora DNA).
// 🔗 Depends on: react, lucide-react, @/app/actions/orders, @/app/actions/payment, @/components/admin/orders/ActionButton, sonner
// 💥 Used by (Blast Radius): Halaman manajemen order admin (/admin/orders)

'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock,
  MessageSquare,
  Package
} from 'lucide-react';
import { updateOrderStatus, getOrderDetail } from '@/app/actions/orders';
import { verifyManualPayment } from '@/app/actions/payment';
import { toast } from 'sonner';
import { OrderSelect, OrderItemSelect } from '@/db/schema/orders';
import { ActionButton } from '@/components/admin/orders/ActionButton';

type OrderWithItems = OrderSelect & {
  items?: OrderItemSelect[];
};

interface OrderListProps {
  readonly initialOrders: OrderSelect[];
}

export default function OrderList({ initialOrders }: OrderListProps) {
  const [orders, setOrders] = useState<OrderSelect[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusUpdate = async (orderId: string, newStatus: any) => {
    setIsUpdating(true);
    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      toast.success(res.message || `Status pesanan diperbarui ke ${newStatus}`);
    } else {
      toast.error(res.error || "Gagal memperbarui status");
    }
    setIsUpdating(false);
  };

  const handleVerifyManualPayment = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);
    const res = await verifyManualPayment(selectedOrder.id);
    if (res.success) {
      // Perbarui status lokal di tabel
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, paymentStatus: 'PAID', status: 'PROCESSING' } : o));
      // Perbarui status lokal di modal
      setSelectedOrder({ ...selectedOrder, paymentStatus: 'PAID', status: 'PROCESSING' });
      toast.success("Pembayaran berhasil diverifikasi secara manual! Pesanan otomatis masuk tahap PROCESSING.");
    } else {
      toast.error(res.error || "Gagal memverifikasi pembayaran");
    }
    setIsUpdating(false);
  };

  const handleViewDetail = async (orderId: string) => {
    setIsDetailLoading(true);
    const res = await getOrderDetail(orderId);
    if (res.success && res.data) {
      setSelectedOrder(res.data as OrderWithItems);
    } else {
      toast.error(res.error || "Gagal mengambil detail pesanan");
    }
    setIsDetailLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'PROCESSING': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'CANCELLED': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-3.5 h-3.5" />;
      case 'PROCESSING': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'CANCELLED': return <XCircle className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'MENUNGGU';
      case 'PROCESSING': return 'DIPROSES';
      case 'COMPLETED': return 'SELESAI';
      case 'CANCELLED': return 'DIBATALKAN';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-zinc-900 backdrop-blur-xl p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-650 w-4 h-4" />
          <input 
            type="text"
            placeholder="Cari nama pelanggan atau ID pesanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-650"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Filter className="text-zinc-400 dark:text-zinc-600 w-4 h-4 shrink-0" />
          {[
            { label: 'SEMUA', value: 'ALL' },
            { label: 'MENUNGGU', value: 'PENDING' },
            { label: 'DIPROSES', value: 'PROCESSING' },
            { label: 'SELESAI', value: 'COMPLETED' },
            { label: 'DIBATALKAN', value: 'CANCELLED' }
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setStatusFilter(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                statusFilter === item.value 
                  ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/10' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-750'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 backdrop-blur-xl rounded-xl border border-zinc-250 dark:border-zinc-800/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-850">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">ID Pesanan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Pelanggan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Total</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Tanggal</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada pesanan yang ditemukan
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors border-b border-zinc-100 dark:border-zinc-800/40 group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 font-bold">{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{order.customerName}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">{order.customerPhone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        IDR {order.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-zinc-500 dark:text-amber-400">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewDetail(order.id)}
                          className="p-2 text-amber-500 dark:text-amber-500 hover:text-zinc-950 dark:hover:text-zinc-950 hover:bg-amber-500 dark:hover:bg-amber-500 border border-amber-500/20 dark:border-amber-500/30 rounded-lg transition-all bg-amber-500/10"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <a 
                          href={`https://wa.me/${order.customerPhone?.replaceAll(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-amber-500 dark:text-amber-500 hover:text-zinc-950 dark:hover:text-zinc-950 hover:bg-amber-500 dark:hover:bg-amber-500 border border-amber-500/20 dark:border-amber-500/30 rounded-lg transition-all bg-amber-500/10"
                          title="Hubungi WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-zinc-200 dark:border-zinc-800">
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/50">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter text-zinc-900 dark:text-white flex items-center gap-2">
                  <span>Detail Pesanan</span>
                  <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 font-bold bg-white dark:bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800">{selectedOrder.id}</span>
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mt-1">Dibuat pada {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6 text-zinc-400 dark:text-zinc-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="relative p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {isDetailLoading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {/* Customer & Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-zinc-50 dark:bg-zinc-950/70 rounded-2xl border border-zinc-100 dark:border-zinc-800/80">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">Pelanggan</span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">WhatsApp</span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100">{selectedOrder.customerPhone || '-'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">Metode Pembayaran</span>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest text-xs">
                      {selectedOrder.paymentMethod === 'MIDTRANS' && 'Midtrans (Otomatis)'}
                      {selectedOrder.paymentMethod === 'MANUAL_TRANSFER' && 'Transfer Manual'}
                      {selectedOrder.paymentMethod === 'UNSET' && 'Belum Memilih'}
                      {!selectedOrder.paymentMethod && 'WhatsApp Manual'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">Status Pembayaran</span>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black border uppercase ${
                        selectedOrder.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                        selectedOrder.paymentStatus === 'PENDING_VERIFICATION' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                        selectedOrder.paymentStatus === 'EXPIRED' ? 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-500 border-zinc-500/20' :
                        selectedOrder.paymentStatus === 'FAILED' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' :
                        'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20'
                      }`}>
                        {selectedOrder.paymentStatus || 'UNPAID'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bukti Transfer Seksi */}
              {selectedOrder.paymentMethod === 'MANUAL_TRANSFER' && selectedOrder.paymentProofUrl && (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/70 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">Bukti Transfer Pembeli</span>
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowLightbox(true)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLightbox(true); }}
                    className="relative w-40 h-56 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 group cursor-zoom-in"
                  >
                    <img src={selectedOrder.paymentProofUrl} alt="Bukti Transfer" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Eye size={14} /> Perbesar
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-4">Item Pesanan (Snapshots)</span>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-950/90 border border-zinc-100 dark:border-zinc-800/85 rounded-2xl shadow-sm">
                      <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                        {item.productImage ? (
                          <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                             <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 block truncate">{item.productName}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium uppercase tracking-wider">Varian: {item.variantName}</span>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">IDR {item.price.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-bold uppercase tracking-widest">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Actions & Status */}
              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-2 text-center md:text-left">Aksi Pengelolaan</span>
                  <div className="flex flex-wrap gap-2">
                    {/* Verifikasi Pembayaran Manual */}
                    {selectedOrder.paymentMethod === 'MANUAL_TRANSFER' && selectedOrder.paymentStatus === 'PENDING_VERIFICATION' && (
                      <ActionButton
                        onClick={handleVerifyManualPayment}
                        label="Verifikasi Pembayaran Lunas"
                        variant="success"
                        isLoading={isUpdating}
                      />
                    )}

                    {/* Dynamic Action Buttons based on FSM */}
                    {selectedOrder.status === 'PENDING' && (
                      <>
                        <ActionButton
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'PROCESSING')}
                          label="Proses Pesanan"
                          variant="primary"
                          isLoading={isUpdating}
                        />
                        <ActionButton
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                          label="Batalkan"
                          variant="danger"
                          isLoading={isUpdating}
                        />
                      </>
                    )}
 
                    {selectedOrder.status === 'PROCESSING' && (
                      <>
                        <ActionButton
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'COMPLETED')}
                          label="Tandai Selesai"
                          variant="success"
                          isLoading={isUpdating}
                        />
                        <ActionButton
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                          label="Batalkan"
                          variant="danger"
                          isLoading={isUpdating}
                        />
                      </>
                    )}
 
                    {selectedOrder.status === 'COMPLETED' && (
                        <ActionButton
                          onClick={() => handleStatusUpdate(selectedOrder.id, 'CANCELLED')}
                          label="Batalkan Pesanan (Kembalikan Stok)"
                          variant="danger"
                          isLoading={isUpdating}
                        />
                    )}
 
                    {selectedOrder.status === 'CANCELLED' && (
                      <ActionButton
                        onClick={() => handleStatusUpdate(selectedOrder.id, 'PENDING')}
                        label="Kembalikan ke Menunggu"
                        variant="primary"
                        isLoading={isUpdating}
                      />
                    )}
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block mb-1">Total Pesanan</span>
                  <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100">IDR {selectedOrder.totalPrice.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Bukti Transfer Zoomed */}
      {showLightbox && selectedOrder?.paymentProofUrl && (
        <div 
          role="button"
          tabIndex={0}
          onClick={() => setShowLightbox(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLightbox(false); }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-zinc-950/95 backdrop-blur-md cursor-zoom-out"
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-2xl animate-in zoom-in-95 duration-300">
            <img src={selectedOrder.paymentProofUrl} alt="Bukti Transfer Zoomed" className="w-full h-full object-contain" />
            <div className="absolute top-4 right-4 bg-black/60 hover:bg-black/85 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors">
              TUTUP
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
