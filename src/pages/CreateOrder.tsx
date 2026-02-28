import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { saveOrder, generateOrderId, getEmployees, getSettings } from '../lib/db';
import type { EmployeeRole, AppSettings } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

function inputClass(hasError?: boolean) {
    return clsx(
        'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-shadow',
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
    );
}

function labelClass() {
    return 'block text-xs font-medium text-gray-600 mb-1.5';
}

function formatCurrency(val: string): string {
    const raw = val.replace(/\D/g, ''); // Remove all non-digits
    if (!raw) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(raw));
}

export default function CreateOrder() {
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);

    const [settings, setSettings] = useState<AppSettings | null>(null);
    const orderId = useRef(generateOrderId()).current;

    const { user } = useAuth();

    // Using refs or state for static collections is fine. State for settings:
    const employees = getEmployees();
    const florists = employees.filter(e => e.role === 'florist' || e.role === 'lead_florist');
    const dispatchers = employees.filter(e => e.role === 'dispatcher');

    useEffect(() => {
        setSettings(getSettings());
    }, []);

    const now = new Date();
    const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [form, setForm] = useState({
        customerName: '',
        customerPhone: '',
        customerSource: '',
        productType: '',
        productTypeCustom: '',
        productDetails: '',
        orderValue: '', // Store as string for input masking
        deposit: '',     // Store as string for input masking
        deliveryDate: defaultDate,
        deliveryTime: '',
        notes: '',
        floristId: '',
        shipperId: '',
        flowerImage: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dragOver, setDragOver] = useState(false);

    // Init form defaults once settings load
    useEffect(() => {
        if (settings) {
            setForm(f => ({
                ...f,
                customerSource: f.customerSource || settings.sources[0] || 'Khác',
                productType: f.productType || settings.productTypes[0] || 'Khác',
            }));
        }
    }, [settings]);

    function set(key: string, value: string) {
        setForm(f => ({ ...f, [key]: value }));
        setErrors(e => { const ne = { ...e }; delete ne[key]; return ne; });
    }

    function handleCurrencyChange(key: 'orderValue' | 'deposit', val: string) {
        set(key, formatCurrency(val));
    }

    function validate(): boolean {
        const e: Record<string, string> = {};
        if (!form.customerName.trim()) e.customerName = 'Bắt buộc';
        if (form.productType === 'Khác' && !form.productTypeCustom.trim()) e.productTypeCustom = 'Bắt buộc';

        const rawValue = Number(form.orderValue.replace(/\D/g, ''));
        if (!rawValue || rawValue <= 0) e.orderValue = 'Giá trị phải > 0';

        if (!form.deliveryDate) e.deliveryDate = 'Bắt buộc';
        if (!form.deliveryTime) e.deliveryTime = 'Bắt buộc';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleImageFile(file: File) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => set('flowerImage', e.target?.result as string);
        reader.readAsDataURL(file);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        const deliveryDateTime = new Date(`${form.deliveryDate}T${form.deliveryTime || '00:00'}`).toISOString();
        const finalProductType = form.productType === 'Khác' ? form.productTypeCustom : form.productType;
        const rawOrderValue = Number(form.orderValue.replace(/\D/g, ''));
        const rawDeposit = Number(form.deposit.replace(/\D/g, ''));

        saveOrder({
            id: orderId,
            customerName: form.customerName.trim(),
            customerPhone: form.customerPhone.trim(),
            customerSource: form.customerSource,
            productType: finalProductType,
            productDetails: form.productDetails,
            orderValue: rawOrderValue,
            deposit: rawDeposit,
            deliveryDateTime,
            status: 'new',
            floristId: form.floristId,
            shipperId: form.shipperId,
            notes: form.notes,
            flowerImage: form.flowerImage,
            createdAt: new Date().toISOString(),
            createdBy: user?.name,
        });

        toast.success('Tạo đơn hàng thành công! 🌸');
        navigate('/orders');
    }

    if (!settings) return null;

    return (
        <div className="max-w-2xl mx-auto p-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Tạo Đơn Hàng Mới</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="font-semibold text-gray-800 pb-3 border-b border-gray-100">
                        1. Thông tin đơn hàng
                    </h2>

                    {/* Order ID */}
                    <div>
                        <label className={labelClass()}>ID Đơn hàng</label>
                        <input
                            type="text"
                            value={orderId}
                            readOnly
                            className="w-full border border-gray-100 bg-gray-50 rounded-xl px-3 py-2.5 text-sm text-gray-400 font-mono cursor-not-allowed"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className={labelClass()}>Tên khách hàng *</label>
                                <input
                                    type="text"
                                    value={form.customerName}
                                    onChange={e => set('customerName', e.target.value)}
                                    placeholder="Tên khách"
                                    className={inputClass(!!errors.customerName)}
                                />
                                {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
                            </div>
                            <div className="flex-1">
                                <label className={labelClass()}>SĐT (tùy chọn)</label>
                                <input
                                    type="text"
                                    value={form.customerPhone}
                                    onChange={e => set('customerPhone', e.target.value)}
                                    placeholder="Số ĐT"
                                    className={inputClass()}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass()}>Nguồn khách hàng *</label>
                            <select
                                value={form.customerSource}
                                onChange={e => set('customerSource', e.target.value)}
                                className={inputClass()}
                            >
                                {settings.sources.map(s => <option key={s} value={s}>{s}</option>)}
                                {!settings.sources.includes('Khác') && <option value="Khác">Khác</option>}
                            </select>
                        </div>
                    </div>

                    {/* Product */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass()}>Loại sản phẩm *</label>
                                <select
                                    value={form.productType}
                                    onChange={e => set('productType', e.target.value)}
                                    className={inputClass()}
                                >
                                    {settings.productTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    {!settings.productTypes.includes('Khác') && <option value="Khác">Khác</option>}
                                </select>
                            </div>
                            {form.productType === 'Khác' && (
                                <div>
                                    <label className={labelClass()}>Mô tả loại sản phẩm *</label>
                                    <input
                                        type="text"
                                        value={form.productTypeCustom}
                                        onChange={e => set('productTypeCustom', e.target.value)}
                                        placeholder="Nhập loại sản phẩm..."
                                        className={inputClass(!!errors.productTypeCustom)}
                                    />
                                    {errors.productTypeCustom && <p className="text-xs text-red-500 mt-1">{errors.productTypeCustom}</p>}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={labelClass()}>Chi tiết sản phẩm</label>
                            <textarea
                                value={form.productDetails}
                                onChange={e => set('productDetails', e.target.value)}
                                placeholder="Hoa hồng đỏ 30 bông, bọc lưới đen..."
                                rows={form.productType === 'Khác' ? 5 : 2}
                                className={clsx(inputClass(), 'resize-none')}
                            />
                        </div>
                    </div>

                    {/* Value + Deposit */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass()}>Giá trị đơn hàng (VND) *</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.orderValue}
                                onChange={e => handleCurrencyChange('orderValue', e.target.value)}
                                placeholder="0"
                                className={inputClass(!!errors.orderValue)}
                            />
                            {errors.orderValue && <p className="text-xs text-red-500 mt-1">{errors.orderValue}</p>}
                        </div>
                        <div>
                            <label className={labelClass()}>Đặt cọc (VND)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={form.deposit}
                                onChange={e => handleCurrencyChange('deposit', e.target.value)}
                                placeholder="0"
                                className={inputClass()}
                            />
                        </div>
                    </div>

                    {/* Date + Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass()}>Ngày nhận *</label>
                            <input
                                type="date"
                                value={form.deliveryDate}
                                onChange={e => set('deliveryDate', e.target.value)}
                                className={inputClass(!!errors.deliveryDate)}
                            />
                            {errors.deliveryDate && <p className="text-xs text-red-500 mt-1">{errors.deliveryDate}</p>}
                        </div>
                        <div>
                            <label className={labelClass()}>Giờ nhận *</label>
                            <input
                                type="time"
                                value={form.deliveryTime}
                                onChange={e => set('deliveryTime', e.target.value)}
                                className={inputClass(!!errors.deliveryTime)}
                            />
                            {errors.deliveryTime && <p className="text-xs text-red-500 mt-1">{errors.deliveryTime}</p>}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelClass()}>Thông tin nhận / Ghi chú</label>
                        <textarea
                            value={form.notes}
                            onChange={e => set('notes', e.target.value)}
                            placeholder="Địa chỉ giao hàng, SĐT người nhận, lời chúc đi kèm..."
                            rows={3}
                            className={clsx(inputClass(), 'resize-none')}
                        />
                    </div>

                    {/* Image upload */}
                    <div>
                        <label className={labelClass()}>Mẫu hoa (Tùy chọn)</label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleImageFile(f); }}
                            className={clsx(
                                'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
                                dragOver ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                            )}
                        >
                            {form.flowerImage ? (
                                <img src={form.flowerImage} alt="preview" className="max-h-40 mx-auto rounded-lg object-cover shadow-sm" />
                            ) : (
                                <>
                                    <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-pink-600 font-medium">Click để tải ảnh hoặc kéo thả vào đây</p>
                                    <p className="text-xs text-gray-400 mt-1">Hỗ trợ JPG, PNG (Tối đa 5MB)</p>
                                </>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                        />
                    </div>
                </div>

                {/* SECTION 2 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="font-semibold text-gray-800 pb-3 border-b border-gray-100">
                        2. Phân công nhân sự
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass()}>Thợ cắm hoa</label>
                            <select
                                value={form.floristId}
                                onChange={e => set('floristId', e.target.value)}
                                disabled={!(user?.isAdmin || user?.role === 'lead_florist')}
                                className={clsx(inputClass(), !(user?.isAdmin || user?.role === 'lead_florist') && 'bg-gray-50 cursor-not-allowed opacity-75')}
                            >
                                <option value="">Chưa phân công</option>
                                {florists.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                            {!(user?.isAdmin || user?.role === 'lead_florist') && (
                                <p className="text-[10px] text-gray-400 mt-1">Chỉ Admin/Thợ chính mới có quyền phân công</p>
                            )}
                        </div>
                        <div>
                            <label className={labelClass()}>Người giao hàng (Vận đơn)</label>
                            <select
                                value={form.shipperId}
                                onChange={e => set('shipperId', e.target.value)}
                                className={inputClass()}
                            >
                                <option value="">Chưa phân công</option>
                                {dispatchers.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition-colors shadow-md"
                    >
                        Tạo đơn hàng
                    </button>
                </div>
            </form>
        </div>
    );
}
