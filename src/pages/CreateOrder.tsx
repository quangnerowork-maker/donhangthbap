import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { saveOrder, generateOrderId } from '../lib/db';
import { useSettings, useEmployees } from '../hooks/useDatabase';
import { useAuth } from '../contexts/AuthContext';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

function inputClass(hasError?: boolean) {
    return clsx(
        'w-full border rounded-xl px-4 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all shadow-sm',
        hasError ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'
    );
}

function selectClass(hasError?: boolean) {
    return clsx(
        inputClass(hasError),
        'appearance-none bg-no-repeat bg-[length:16px] bg-[right_12px_center]',
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')]"
    );
}

function labelClass() {
    return 'block text-[12px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider';
}

function formatCurrency(val: string): string {
    const raw = val.replace(/\D/g, ''); // Remove all non-digits
    if (!raw) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(raw));
}

export default function CreateOrder() {
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);

    const [orderId, setOrderId] = useState<string>('');
    const { settings, loading: settingsLoading } = useSettings();
    const { employees: allEmployees, loading: empsLoading } = useEmployees();

    useEffect(() => {
        generateOrderId().then(setOrderId);
    }, []);

    const { user } = useAuth();

    const florists = allEmployees.filter(e => e.role === 'florist' || e.role === 'lead_florist');
    const dispatchers = allEmployees.filter(e => e.role === 'dispatcher');

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
        deliveryHour: '',
        deliveryMinute: '',
        notes: '',
        floristId: '',
        shipperId: '',
        flowerImage: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [dragOver, setDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
        if (!form.deliveryHour) e.deliveryTime = 'Bắt buộc';
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    function handleImageFile(file: File) {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => set('flowerImage', e.target?.result as string);
        reader.readAsDataURL(file);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) {
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
            return;
        }

        setSubmitting(true);
        try {
            const timeStr = form.deliveryHour ? `${form.deliveryHour.padStart(2, '0')}:${(form.deliveryMinute || '00').padStart(2, '0')}` : '00:00';
            const deliveryDateTime = new Date(`${form.deliveryDate}T${timeStr}`).toISOString();
            const finalProductType = form.productType === 'Khác' ? form.productTypeCustom : form.productType;
            const rawOrderValue = Number(form.orderValue.replace(/\D/g, ''));
            const rawDeposit = Number(form.deposit.replace(/\D/g, ''));

            await saveOrder({
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
        } catch (err) {
            console.error('Lỗi khi lưu đơn hàng:', err);
            toast.error('Không thể lưu đơn hàng. Kiểm tra kết nối mạng hoặc quyền truy cập Firebase.');
        } finally {
            setSubmitting(false);
        }
    }

    if (settingsLoading || empsLoading || !orderId) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-gray-400 animate-pulse">Đang định cấu hình...</div>
        </div>
    );

    if (!settings) return null;

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-6 lg:p-8 pb-24">
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-400" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">Tạo Đơn Hàng Mới</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SECTION 1 */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                    <h2 className="font-semibold text-gray-800 pb-3 border-b border-gray-100">
                        1. Thông tin đơn hàng
                    </h2>

                    {/* Order ID + Creator */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass()}>ID Đơn hàng</label>
                            <input
                                type="text"
                                value={orderId}
                                readOnly
                                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 h-11 text-sm text-gray-400 font-mono cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className={labelClass()}>Người tạo đơn</label>
                            <input
                                type="text"
                                value={user?.name || '—'}
                                readOnly
                                className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 h-11 text-sm text-gray-500 font-medium cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <div>
                                <label className={labelClass()}>Tên khách hàng *</label>
                                <input
                                    type="text"
                                    value={form.customerName}
                                    onChange={e => set('customerName', e.target.value)}
                                    placeholder="Tên khách"
                                    className={inputClass(!!errors.customerName)}
                                />
                                {errors.customerName && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.customerName}</p>}
                            </div>
                            <div>
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
                                className={selectClass()}
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
                                    className={selectClass()}
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
                            <label className={labelClass()}>Giờ nhận * <span className="normal-case font-normal text-gray-400">(24h)</span></label>
                            <div className={`flex gap-2 ${errors.deliveryTime ? 'ring-1 ring-red-400 rounded-xl' : ''}`}>
                                <select
                                    value={form.deliveryHour}
                                    onChange={e => { set('deliveryHour', e.target.value); setErrors(er => { const n = { ...er }; delete n.deliveryTime; return n; }); }}
                                    className={selectClass(!!errors.deliveryTime)}
                                >
                                    <option value="">Giờ</option>
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={String(i)}>{String(i).padStart(2, '0')}h</option>
                                    ))}
                                </select>
                                <select
                                    value={form.deliveryMinute}
                                    onChange={e => set('deliveryMinute', e.target.value)}
                                    className={selectClass()}
                                >
                                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                                        <option key={m} value={m}>{m} phút</option>
                                    ))}
                                </select>
                            </div>
                            {errors.deliveryTime && <p className="text-xs text-red-500 mt-1">Bắt buộc chọn giờ nhận</p>}
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
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-10 h-12 border border-gray-200 text-gray-700 bg-white rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto px-12 h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-gray-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Đang lưu...' : 'Tạo đơn hàng'}
                    </button>
                </div>
            </form>
        </div>
    );
}
