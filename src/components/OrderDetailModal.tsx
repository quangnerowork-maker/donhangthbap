import React, { useState } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import type { Order, OrderStatus } from '../types';
import { updateOrder, getEmployees, getSettings } from '../lib/db';
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
    const employees = getEmployees();
    const settings = getSettings();
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

    function handleSave() {
        updateOrder({ ...order, ...form });
        toast.success('Đã cập nhật đơn hàng');
        onSaved();
        onClose();
    }

    const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent bg-white';
    const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                    <div>
                        <p className="text-xs font-mono text-gray-400">#{order.id}</p>
                        <h2 className="font-bold text-gray-900 text-lg">{order.customerName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Order Info (readonly) */}
                    <div className="bg-gray-50 rounded-2xl p-4 grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Giá trị đơn</p>
                            <p className="text-sm font-bold text-gray-900">{fmt(order.orderValue)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Đặt cọc</p>
                            <p className="text-sm font-bold text-green-600">{fmt(order.deposit)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Ngày nhận</p>
                            <p className="text-sm font-bold text-gray-900">{new Date(order.deliveryDateTime).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Giờ nhận</p>
                            <p className="text-sm font-bold text-pink-600">{new Date(order.deliveryDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Còn lại</p>
                            <p className="text-sm font-bold text-orange-500">{fmt(order.orderValue - order.deposit)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-medium mb-0.5">Nguồn</p>
                            <p className="text-sm font-medium text-gray-700">{order.customerSource}</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className={labelCls}>Trạng thái đơn hàng</label>
                        <div className="relative">
                            <select
                                value={form.status}
                                onChange={e => set('status', e.target.value)}
                                className={clsx(inputCls, 'appearance-none pr-8')}
                            >
                                {STATUS_OPTIONS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Product Type */}
                    <div>
                        <label className={labelCls}>Loại sản phẩm</label>
                        <div className="relative">
                            <select
                                value={form.productType}
                                onChange={e => set('productType', e.target.value)}
                                className={clsx(inputCls, 'appearance-none pr-8')}
                            >
                                {settings.productTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                                {!settings.productTypes.includes(form.productType) && (
                                    <option value={form.productType}>{form.productType}</option>
                                )}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Thợ cắm hoa</label>
                            <div className="relative">
                                <select
                                    value={form.floristId}
                                    onChange={e => set('floristId', e.target.value)}
                                    className={clsx(inputCls, 'appearance-none pr-8')}
                                >
                                    <option value="">Chọn thợ</option>
                                    {florists.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Người vận đơn</label>
                            <div className="relative">
                                <select
                                    value={form.shipperId}
                                    onChange={e => set('shipperId', e.target.value)}
                                    className={clsx(inputCls, 'appearance-none pr-8')}
                                >
                                    <option value="">Chưa phân công</option>
                                    {dispatchers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
                            <img src={order.flowerImage} alt="flower" className="rounded-xl max-h-40 object-cover" />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                        <Save size={14} />
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
}
