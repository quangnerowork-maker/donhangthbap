import { useState } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import { useEmployees, useSettings } from '../hooks/useDatabase';
import { updateOrder } from '../lib/db';
import type { Order, OrderStatus } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: 'new', label: 'Mới tạo' },
    { value: 'in_progress', label: 'Đang làm' },
    { value: 'delivering', label: 'Đang giao' },
    { value: 'completed', label: 'Hoàn thành' },
];

function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

interface Props {
    order: Order;
    onClose: () => void;
    onSaved: () => void;
}

export default function OrderDetailModal({ order, onClose, onSaved }: Props) {
    const { employees, loading: empsLoading } = useEmployees();
    const { settings, loading: settingsLoading } = useSettings();

    const florists = employees.filter(e => e.role === 'florist' || e.role === 'lead_florist');
    const dispatchers = employees.filter(e => e.role === 'dispatcher');

    const [form, setForm] = useState({
        status: order.status,
        notes: order.notes ?? '',
        productDetails: order.productDetails ?? '',
        floristId: order.floristId,
        shipperId: order.shipperId,
        productType: order.productType,
        customerSource: order.customerSource,
        orderValue: order.orderValue,
        deposit: order.deposit,
    });

    function set(key: string, value: string | number) {
        setForm(f => ({ ...f, [key]: value }));
    }

    async function handleSave() {
        await updateOrder({ ...order, ...form });
        toast.success('Đã cập nhật đơn hàng');
        onSaved();
        onClose();
    }

    if (empsLoading || settingsLoading || !settings) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 text-gray-400">Đang tải chi tiết...</div>
        </div>
    );

    const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white transition-all';
    const labelCls = 'block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-lg h-full sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
                    <div>
                        <p className="text-[10px] font-mono text-gray-400">#{order.id}</p>
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">{order.customerName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Order Info (readonly) */}
                    <div className="bg-gray-50 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-3 gap-4 border border-gray-100">
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Giá trị đơn</p>
                            <p className="text-sm font-extrabold text-gray-900">{fmt(order.orderValue)}</p>
                        </div>
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Đặt cọc</p>
                            <p className="text-sm font-extrabold text-emerald-600">{fmt(order.deposit)}</p>
                        </div>
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Còn lại</p>
                            <p className="text-sm font-extrabold text-orange-500">{fmt(order.orderValue - order.deposit)}</p>
                        </div>
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Ngày nhận</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(order.deliveryDateTime).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Giờ nhận</p>
                            <p className="text-sm font-bold text-pink-600">{new Date(order.deliveryDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="col-span-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Nguồn</p>
                            <p className="text-sm font-medium text-gray-700">{order.customerSource}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Status */}
                        <div>
                            <label className={labelCls}>Trạng thái đơn hàng</label>
                            <div className="relative">
                                <select
                                    value={form.status}
                                    onChange={e => set('status', e.target.value)}
                                    className={clsx(inputCls, 'appearance-none pr-10 h-12')}
                                >
                                    {STATUS_OPTIONS.map(s => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Product Type */}
                        <div>
                            <label className={labelCls}>Loại sản phẩm</label>
                            <div className="relative">
                                <select
                                    value={form.productType}
                                    onChange={e => set('productType', e.target.value)}
                                    className={clsx(inputCls, 'appearance-none pr-10 h-12')}
                                >
                                    {settings.productTypes.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                    {!settings.productTypes.includes(form.productType) && (
                                        <option value={form.productType}>{form.productType}</option>
                                    )}
                                </select>
                                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Product Details */}
                        <div>
                            <label className={labelCls}>Thông tin sản phẩm</label>
                            <textarea
                                value={form.productDetails}
                                onChange={e => set('productDetails', e.target.value)}
                                placeholder="Chi tiết về sản phẩm, màu sắc, kiểu dáng..."
                                rows={2}
                                className={clsx(inputCls, 'resize-none')}
                            />
                        </div>

                        {/* Assign Staff */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Thợ cắm hoa</label>
                                <div className="relative">
                                    <select
                                        value={form.floristId}
                                        onChange={e => set('floristId', e.target.value)}
                                        className={clsx(inputCls, 'appearance-none pr-10 h-12')}
                                    >
                                        <option value="">Chọn thợ</option>
                                        {florists.map(f => (
                                            <option key={f.id} value={f.id}>{f.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Người vận đơn</label>
                                <div className="relative">
                                    <select
                                        value={form.shipperId}
                                        onChange={e => set('shipperId', e.target.value)}
                                        className={clsx(inputCls, 'appearance-none pr-10 h-12')}
                                    >
                                        <option value="">Chưa phân công</option>
                                        {dispatchers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className={labelCls}>Thông tin nhận / Ghi chú</label>
                            <textarea
                                value={form.notes}
                                onChange={e => set('notes', e.target.value)}
                                placeholder="Địa chỉ giao, SĐT, lời chúc..."
                                rows={3}
                                className={clsx(inputCls, 'resize-none')}
                            />
                        </div>

                        {/* Image */}
                        {order.flowerImage && (
                            <div>
                                <label className={labelCls}>Mẫu hoa</label>
                                <div className="rounded-2xl overflow-hidden border border-gray-100">
                                    <img src={order.flowerImage} alt="flower" className="w-full object-cover max-h-64" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 flex flex-col sm:flex-row gap-3 bg-white shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full sm:flex-1 h-12 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="w-full sm:flex-1 h-12 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 transition-all active:scale-[0.98]"
                    >
                        <Save size={18} />
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
