import React, { useState, useCallback } from 'react';
import { PlusCircle, Pencil, Trash2, Users, Flower2, Truck, X, Check } from 'lucide-react';
import { getEmployees, getOrders, saveEmployee, updateEmployee, deleteEmployee } from '../lib/db';
import type { Employee, EmployeeRole } from '../types';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

function genEmpId() {
    return `emp-${Date.now()}`;
}

const ACTIVE_STATUSES = ['new', 'in_progress', 'delivering'];

export default function Employees() {
    const [, setTick] = useState(0);
    const refresh = useCallback(() => setTick(t => t + 1), []);

    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [form, setForm] = useState({ name: '', username: '', password: '', role: 'florist' as EmployeeRole });

    const employees = getEmployees();
    const orders = getOrders();

    const leadFlorists = employees.filter(e => e.role === 'lead_florist');
    const florists = employees.filter(e => e.role === 'florist');
    const dispatchers = employees.filter(e => e.role === 'dispatcher');

    function activeOrderCount(empId: string, role: EmployeeRole) {
        return orders.filter(o =>
            ACTIVE_STATUSES.includes(o.status) &&
            (role === 'florist' || role === 'lead_florist' ? o.floristId === empId : o.shipperId === empId)
        ).length;
    }

    function totalOrderCount(empId: string, role: EmployeeRole) {
        return orders.filter(o =>
            role === 'florist' || role === 'lead_florist' ? o.floristId === empId : o.shipperId === empId
        ).length;
    }

    function openAdd() {
        setEditTarget(null);
        setForm({ name: '', username: '', password: '', role: 'florist' });
        setModalOpen(true);
    }

    function openEdit(emp: Employee) {
        setEditTarget(emp);
        setForm({ name: emp.name, username: emp.username, password: emp.password, role: emp.role });
        setModalOpen(true);
    }

    function handleSave() {
        if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        if (editTarget) {
            updateEmployee({ ...editTarget, name: form.name.trim(), username: form.username.trim(), password: form.password.trim(), role: form.role });
            toast.success('Cập nhật nhân viên thành công');
        } else {
            saveEmployee({ id: genEmpId(), name: form.name.trim(), username: form.username.trim(), password: form.password.trim(), role: form.role, isAdmin: false });
            toast.success('Thêm nhân viên thành công');
        }
        setModalOpen(false);
        refresh();
    }

    function handleDelete(emp: Employee) {
        const active = activeOrderCount(emp.id, emp.role);
        if (active > 0) {
            toast.error(`Không thể xóa! ${emp.name} đang có ${active} đơn chưa hoàn thành.`);
            return;
        }
        deleteEmployee(emp.id);
        toast.success(`Đã xóa ${emp.name}`);
        refresh();
    }

    const roleLabel: Record<EmployeeRole, string> = {
        florist: 'Thợ cắm hoa',
        lead_florist: 'Thợ chính',
        dispatcher: 'Người vận đơn',
    };

    function EmpCard({ emp }: { emp: Employee }) {
        const active = activeOrderCount(emp.id, emp.role);
        const total = totalOrderCount(emp.id, emp.role);
        return (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <span className={clsx(
                            'inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1',
                            emp.role === 'florist' ? 'bg-pink-100 text-pink-700' :
                                emp.role === 'lead_florist' ? 'bg-rose-100 text-rose-700' :
                                    'bg-violet-100 text-violet-700'
                        )}>
                            {roleLabel[emp.role]}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => openEdit(emp)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        >
                            <Pencil size={14} />
                        </button>
                        <button
                            onClick={() => handleDelete(emp)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                        <span className="text-gray-400">{emp.role === 'florist' || emp.role === 'lead_florist' ? 'Đang làm:' : 'Đang giao:'} </span>
                        <span className={clsx('font-semibold', active > 0 ? 'text-amber-600' : 'text-gray-600')}>
                            {active} đơn
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-400">Tổng: </span>
                        <span className="font-semibold text-gray-600">{total} đơn</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hệ Thống Nhân Sự</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý thợ cắm hoa và người vận đơn</p>
                </div>
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
                >
                    <PlusCircle size={15} />
                    Thêm nhân viên
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Tổng Nhân Viên', count: employees.length, icon: Users, color: 'text-gray-700', bg: 'bg-gray-100' },
                    { label: 'Thợ Chính', count: leadFlorists.length, icon: Flower2, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Thợ Cắm Hoa', count: florists.length, icon: Flower2, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { label: 'Người Vận Đơn', count: dispatchers.length, icon: Truck, color: 'text-violet-600', bg: 'bg-violet-50' },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-gray-400">{s.label}</p>
                                <p className={clsx('text-3xl font-bold mt-1', s.color)}>{s.count}</p>
                            </div>
                            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
                                <s.icon size={18} className={s.color} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lead Florists */}
            {leadFlorists.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Flower2 size={16} className="text-rose-500" />
                        <h2 className="font-semibold text-gray-700">Thợ Chính ({leadFlorists.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {leadFlorists.map(e => <EmpCard key={e.id} emp={e} />)}
                    </div>
                </div>
            )}

            {/* Florists */}
            {florists.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Flower2 size={16} className="text-pink-500" />
                        <h2 className="font-semibold text-gray-700">Thợ Cắm Hoa ({florists.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {florists.map(e => <EmpCard key={e.id} emp={e} />)}
                    </div>
                </div>
            )}

            {/* Dispatchers */}
            {dispatchers.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Truck size={16} className="text-violet-500" />
                        <h2 className="font-semibold text-gray-700">Người Vận Đơn ({dispatchers.length})</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {dispatchers.map(e => <EmpCard key={e.id} emp={e} />)}
                    </div>
                </div>
            )}

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-gray-900">{editTarget ? 'Sửa nhân viên' : 'Thêm nhân viên mới'}</h3>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Họ và tên *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="Nhập tên nhân viên"
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Tên đăng nhập *</label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                                        placeholder="user123"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Mật khẩu *</label>
                                    <input
                                        type="text"
                                        value={form.password}
                                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                        placeholder="••••"
                                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1.5">Vai trò</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['lead_florist', 'florist', 'dispatcher'] as EmployeeRole[]).map(r => (
                                        <button
                                            key={r}
                                            onClick={() => setForm(f => ({ ...f, role: r }))}
                                            className={clsx(
                                                'flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-medium border-2 transition-all',
                                                form.role === r
                                                    ? r === 'florist' ? 'border-pink-500 bg-pink-50 text-pink-700' :
                                                        r === 'lead_florist' ? 'border-rose-500 bg-rose-50 text-rose-700' :
                                                            'border-violet-500 bg-violet-50 text-violet-700'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                            )}
                                        >
                                            {r === 'dispatcher' ? <Truck size={14} /> : <Flower2 size={14} />}
                                            {r === 'lead_florist' ? 'Thợ chính' : r === 'florist' ? 'Thợ cắm hoa' : 'Vận đơn'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <Check size={14} />
                                {editTarget ? 'Cập nhật' : 'Thêm mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
