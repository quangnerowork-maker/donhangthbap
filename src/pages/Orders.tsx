import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PlusCircle, Filter, LayoutGrid, List } from 'lucide-react';
import { updateOrder } from '../lib/db';
import { useOrders, useEmployees } from '../hooks/useDatabase';
import type { Order, OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import OrderDetailModal from '../components/OrderDetailModal';
import { clsx } from 'clsx';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- UTILS ---
function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function urgency(order: Order): 'urgent' | 'warning' | 'normal' {
    if (order.status === 'completed') return 'normal';
    const diff = (new Date(order.deliveryDateTime).getTime() - Date.now()) / 60000;
    if (diff < 120) return 'urgent';
    if (diff < 240) return 'warning';
    return 'normal';
}

function formatDelivery(iso: string) {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const COLUMNS: { status: OrderStatus; label: string; color: string; bg: string; headerBg: string }[] = [
    { status: 'new', label: 'Mới tạo', color: 'text-blue-700', bg: 'bg-blue-50', headerBg: 'bg-blue-500' },
    { status: 'in_progress', label: 'Đang làm', color: 'text-amber-700', bg: 'bg-amber-50', headerBg: 'bg-amber-500' },
    { status: 'delivering', label: 'Đang giao', color: 'text-violet-700', bg: 'bg-violet-50', headerBg: 'bg-violet-500' },
    { status: 'completed', label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-50', headerBg: 'bg-emerald-500' },
];

type Filter = 'all' | 'today' | 'tomorrow' | 'custom';

// --- COMPONENTS ---
interface DroppableColumnProps {
    id: string; // OrderStatus
    children: React.ReactNode;
    col: typeof COLUMNS[0];
    count: number;
    isSelected: boolean;
    onClickFilters: () => void;
}
function DroppableColumn({ id, children, col, count, isSelected, onClickFilters }: DroppableColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div className="flex-1 flex flex-col min-w-[280px] sm:min-w-[320px]" onClick={onClickFilters}>
            {/* Header */}
            <div className={clsx(
                'flex items-center justify-between px-3 py-2 rounded-t-xl transition-colors cursor-pointer',
                col.bg,
                isSelected && 'ring-2 ring-pink-400 ring-offset-1 bg-opacity-100 shadow-sm'
            )}>
                <div className="flex items-center gap-2">
                    <div className={clsx('w-2.5 h-2.5 rounded-full', col.headerBg)} />
                    <span className={clsx('text-sm font-semibold', col.color)}>{col.label}</span>
                </div>
                <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full text-white', col.headerBg)}>
                    {count}
                </span>
            </div>

            {/* Droppable Area */}
            <div
                ref={setNodeRef}
                className={clsx(
                    'flex-1 p-2 rounded-b-xl space-y-3 overflow-y-auto min-h-[150px] transition-colors',
                    col.bg,
                    'bg-opacity-40',
                    isOver && 'ring-2 ring-pink-300 ring-inset bg-pink-50'
                )}
            >
                {children}
            </div>
        </div>
    );
}

interface SortableCardProps {
    order: Order;
    employeeMap: Record<string, string>;
    nowTick: number;
    onClick: () => void;
}
function SortableCard({ order, employeeMap, nowTick, onClick }: SortableCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: order.id, data: order });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
    };

    const u = urgency(order);
    const ms = new Date(order.deliveryDateTime).getTime() - nowTick;
    const isOverdue = ms <= 0;
    const hours = Math.floor(Math.abs(ms) / (1000 * 60 * 60));
    const mins = Math.floor((Math.abs(ms) % (1000 * 60 * 60)) / (1000 * 60));
    const countdown = isOverdue ? `Quá hạn: ${hours} giờ ${mins} phút` : `Còn lại: ${hours} giờ ${mins} phút`;
    const isPaid = order.deposit >= order.orderValue;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onClick}
            className={clsx(
                'kanban-card bg-white rounded-xl p-3 shadow-sm border cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative touch-none',
                u === 'urgent' ? 'border-red-400 bg-red-50' : u === 'warning' ? 'border-orange-300 bg-orange-50' : 'border-gray-100'
            )}
        >
            <div className="flex flex-wrap gap-1 mb-2 pointer-events-none">
                {u !== 'normal' && (
                    <span className={clsx(
                        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
                        u === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    )}>
                        {u === 'urgent' ? '🚨 KHẨN' : '⚠️ CẢNH BÁO'}
                    </span>
                )}
                {order.status !== 'completed' && (
                    <span className={clsx(
                        'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isOverdue ? 'bg-red-50 text-red-600 ring-1 ring-red-400/50 shadow-sm' : 'bg-blue-50 text-blue-600'
                    )}>
                        {isOverdue ? '⚠️ ' : '⏳ '}{countdown}
                    </span>
                )}
            </div>

            <div className="flex items-start justify-between gap-1 pointer-events-none">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-mono">#{order.id}</p>
                    <p className="font-semibold text-sm text-gray-900 truncate">{order.customerName}</p>
                    <p className="text-xs text-gray-500">{order.productType}</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{fmt(order.orderValue)}</p>
                    <p className={clsx(
                        'text-[10px] mt-1 px-1.5 py-0.5 rounded inline-block',
                        isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    )}>
                        {isPaid ? 'Đã thanh toán hết' : 'Chưa thanh toán'}
                    </p>
                </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 pointer-events-none">
                <div>
                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">Thợ: {employeeMap[order.floristId] ?? '—'} <span className="text-gray-300 mx-0.5">•</span> Vận đơn: {employeeMap[order.shipperId] ?? 'Trống'}</p>
                    <p className={clsx('text-[10px] font-bold mt-1 inline-flex items-center', u === 'urgent' ? 'text-red-600' : u === 'warning' ? 'text-orange-600' : 'text-gray-600')}>
                        {formatDelivery(order.deliveryDateTime)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// --- MAIN PAGE ---
export default function Orders() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const qsStatus = searchParams.get('status') as OrderStatus | null;

    const [filter, setFilter] = useState<Filter>('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [floristFilter, setFloristFilter] = useState('all');
    const [dispatcherFilter, setDispatcherFilter] = useState('all');

    const [viewMode, setViewMode] = useState<'board' | 'table'>('board');
    const [sortAsc, setSortAsc] = useState(true);


    const { orders: allOrders } = useOrders();
    const { employees: allEmployees } = useEmployees();

    const orders = useMemo(() => {
        if (user?.role === 'florist') {
            return allOrders.filter(o => o.floristId === user.id);
        }
        return allOrders;
    }, [allOrders, user]);

    const employees = allEmployees;

    const [activeOrder, setActiveOrder] = useState<Order | null>(null);
    const [selectedOrderForModal, setSelectedOrderForModal] = useState<Order | null>(null);

    const [nowTick, setNowTick] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNowTick(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    const employeeMap = useMemo(() =>
        Object.fromEntries(employees.map(e => [e.id, e.name])),
        [employees]
    );

    const filterLabels: { key: Filter; label: string }[] = [
        { key: 'all', label: 'Tất cả' },
        { key: 'today', label: 'Hôm nay' },
        { key: 'tomorrow', label: 'Ngày mai' },
    ];

    const florists = useMemo(() => employees.filter(e => e.role === 'florist' || e.role === 'lead_florist'), [employees]);
    const dispatchers = useMemo(() => employees.filter(e => e.role === 'dispatcher'), [employees]);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    function handleDragStart(e: DragStartEvent) {
        const { active } = e;
        const ord = orders.find(o => o.id === active.id);
        if (ord) setActiveOrder(ord);
    }

    async function handleStatusChange(orderId: string, newStatus: OrderStatus) {
        const order = orders.find(o => o.id === orderId);
        if (order && order.status !== newStatus) {
            await updateOrder({ ...order, status: newStatus });
        }
    }

    function handleDragEnd(e: DragEndEvent) {
        setActiveOrder(null);
        const { active, over } = e;
        if (!over) return;

        const orderId = active.id as string;
        const newStatus = over.id as OrderStatus;

        // If dropped in a different column
        if (COLUMNS.some(c => c.status === newStatus)) {
            handleStatusChange(orderId, newStatus);
        }
    }

    // Filter Logic
    const filteredOrders = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(todayStart.getTime() + 86400000);
        const tomorrowEnd = new Date(todayEnd.getTime() + 86400000);

        return orders.filter(o => {
            const d = new Date(o.deliveryDateTime);
            // Date filter
            if (filter === 'today' && (d < todayStart || d >= todayEnd)) return false;
            if (filter === 'tomorrow' && (d < todayEnd || d >= tomorrowEnd)) return false;
            if (filter === 'custom' && selectedDate) {
                const selectedStart = new Date(selectedDate);
                const selectedEnd = new Date(selectedStart.getTime() + 86400000);
                if (d < selectedStart || d >= selectedEnd) return false;
            }

            // Text Search Over name or id
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!o.customerName.toLowerCase().includes(q) && !o.id.toLowerCase().includes(q)) return false;
            }

            // Florist Filter
            if (floristFilter !== 'all' && o.floristId !== floristFilter) return false;

            // Dispatcher Filter
            if (dispatcherFilter !== 'all' && o.shipperId !== dispatcherFilter) return false;

            return true;
        });
    }, [orders, filter, searchQuery, floristFilter, dispatcherFilter]);

    const sortedTableOrders = useMemo(() => {
        const sorted = [...filteredOrders];
        sorted.sort((a, b) => {
            const timeA = new Date(a.deliveryDateTime).getTime();
            const timeB = new Date(b.deliveryDateTime).getTime();
            return sortAsc ? timeA - timeB : timeB - timeA;
        });
        return sorted;
    }, [filteredOrders, sortAsc]);

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            {/* Header / Toolbar */}
            <div className="flex flex-col gap-4 p-4 md:p-6 bg-white border-b border-gray-100 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Quản Lý Đơn Hàng</h1>
                        <p className="text-xs text-gray-400 mt-0.5">Tổng {filteredOrders.length} đơn hàng</p>
                    </div>
                    <button
                        onClick={() => navigate('/create')}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium rounded-xl transition-colors md:hidden"
                    >
                        <PlusCircle size={14} />
                        Tạo mới
                    </button>
                    {/* Desktop Create Button */}
                    <button
                        onClick={() => navigate('/create')}
                        className="hidden md:flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        <PlusCircle size={16} />
                        Tạo đơn mới
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Search */}
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Tìm mã, Tên KH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-48 border border-gray-200 rounded-xl px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all"
                            />
                        </div>

                        {/* Staff Filters */}
                        <div className="flex items-center gap-2">
                            <select
                                value={floristFilter}
                                onChange={(e) => setFloristFilter(e.target.value)}
                                className="flex-1 sm:w-32 border border-gray-200 rounded-xl px-2 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white cursor-pointer"
                            >
                                <option value="all">Mọi Thợ</option>
                                {florists.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                            <select
                                value={dispatcherFilter}
                                onChange={(e) => setDispatcherFilter(e.target.value)}
                                className="flex-1 sm:w-32 border border-gray-200 rounded-xl px-2 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white cursor-pointer"
                            >
                                <option value="all">Mọi Vận đơn</option>
                                {dispatchers.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Date Filter */}
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 overflow-x-auto no-scrollbar">
                            {filterLabels.map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => { setFilter(f.key); setSelectedDate(''); }}
                                    className={clsx(
                                        'px-3 h-8 flex items-center shrink-0 rounded-lg text-xs font-medium transition-all',
                                        filter === f.key && !selectedDate ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    )}
                                >
                                    {f.label}
                                </button>
                            ))}
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setFilter('custom');
                                }}
                                className={clsx(
                                    "border-none bg-transparent text-xs text-gray-600 focus:outline-none rounded h-8 px-2 transition-all cursor-pointer shrink-0",
                                    selectedDate && filter === 'custom' && "font-bold text-gray-900 bg-white shadow-sm ring-1 ring-pink-400"
                                )}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            {/* View Toggle */}
                            <div className="flex bg-gray-100 rounded-xl p-1 shrink-0">
                                <button
                                    onClick={() => setViewMode('board')}
                                    className={clsx('w-10 h-8 flex items-center justify-center rounded-lg transition-colors', viewMode === 'board' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={clsx('w-10 h-8 flex items-center justify-center rounded-lg transition-colors', viewMode === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900')}
                                >
                                    <List size={16} />
                                </button>
                            </div>

                            {/* Status Clear Button (mobile friendly) */}
                            {qsStatus && (
                                <button
                                    onClick={() => setSearchParams({})}
                                    className="flex-1 sm:flex-none text-[10px] text-pink-600 font-semibold px-3 h-10 bg-pink-50 rounded-xl hover:bg-pink-100 transition-colors whitespace-nowrap"
                                >
                                    Tất cả trạng thái
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'board' ? (
                <div className="flex-1 overflow-x-auto p-4 md:p-6 lg:p-8">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex gap-4 h-full min-w-max pb-4">
                            {COLUMNS.map(col => {
                                let colOrders = filteredOrders.filter(o => o.status === col.status);
                                colOrders.sort((a, b) => new Date(a.deliveryDateTime).getTime() - new Date(b.deliveryDateTime).getTime());

                                const isSelectedCol = qsStatus === col.status;
                                const isDimmed = qsStatus && !isSelectedCol;

                                return (
                                    <div key={col.status} className={clsx(
                                        "w-[280px] sm:w-[320px] flex flex-col transition-opacity duration-300",
                                        isDimmed ? "opacity-40 grayscale-[50%]" : "opacity-100"
                                    )}>
                                        <DroppableColumn
                                            id={col.status}
                                            col={col}
                                            count={colOrders.length}
                                            isSelected={isSelectedCol}
                                            onClickFilters={() => {
                                                if (qsStatus === col.status) setSearchParams({});
                                                else setSearchParams({ status: col.status });
                                            }}
                                        >
                                            <SortableContext items={colOrders.map(o => o.id)} strategy={verticalListSortingStrategy}>
                                                {colOrders.length === 0 ? (
                                                    <p className="text-center text-xs text-gray-400 py-4 pointer-events-none">Trống</p>
                                                ) : (
                                                    colOrders.map(order => (
                                                        <SortableCard
                                                            key={order.id}
                                                            order={order}
                                                            employeeMap={employeeMap}
                                                            nowTick={nowTick}
                                                            onClick={() => setSelectedOrderForModal(order)}
                                                        />
                                                    ))
                                                )}
                                            </SortableContext>
                                        </DroppableColumn>
                                    </div>
                                );
                            })}
                        </div>

                        <DragOverlay>
                            {activeOrder ? (
                                <div className="kanban-card bg-white rounded-xl p-3 shadow-2xl border border-pink-400 transform scale-105 rotate-2 cursor-grabbing">
                                    <p className="font-semibold text-sm text-gray-900 truncate">{activeOrder.customerName}</p>
                                    <p className="text-xs text-gray-500">{activeOrder.productType}</p>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            ) : (
                <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
                                    <th className="px-6 py-4 font-medium">Mã Đơn & Khách</th>
                                    <th className="px-6 py-4 font-medium">Sản phẩm</th>
                                    <th className="px-6 py-4 font-medium">Tài chính</th>
                                    <th className="px-6 py-4 font-medium cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setSortAsc(!sortAsc)}>
                                        Thời gian giao {sortAsc ? '↑' : '↓'}
                                    </th>
                                    <th className="px-6 py-4 font-medium">Nhân sự</th>
                                    <th className="px-6 py-4 font-medium">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sortedTableOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Không tìm thấy đơn hàng nào.</td>
                                    </tr>
                                ) : (
                                    sortedTableOrders.map((order, idx) => {
                                        const u = urgency(order);
                                        const ms = new Date(order.deliveryDateTime).getTime() - nowTick;
                                        const isOverdue = ms <= 0;
                                        const hours = Math.floor(Math.abs(ms) / (1000 * 60 * 60));
                                        const mins = Math.floor((Math.abs(ms) % (1000 * 60 * 60)) / (1000 * 60));
                                        const countdown = isOverdue ? `Quá hạn: ${hours} giờ ${mins} phút` : `Còn lại: ${hours} giờ ${mins} phút`;
                                        const isPaid = order.deposit >= order.orderValue;

                                        return (
                                            <tr
                                                key={order.id}
                                                className={clsx(
                                                    'hover:bg-pink-50/50 transition-colors cursor-pointer group',
                                                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                                                )}
                                                onClick={() => setSelectedOrderForModal(order)}
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="text-xs text-gray-400 font-mono mb-1">#{order.id}</p>
                                                    <p className="font-semibold text-sm text-gray-900">{order.customerName}</p>
                                                    {order.customerPhone && <p className="text-xs text-gray-500 mt-1">{order.customerPhone}</p>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-800">{order.productType}</p>
                                                    {u !== 'normal' && (
                                                        <span className={clsx(
                                                            'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-2',
                                                            u === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                                        )}>
                                                            {u === 'urgent' ? '🚨 KHẨN' : '⚠️ CẢNH BÁO'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{fmt(order.orderValue)}</p>
                                                    <p className={clsx(
                                                        'text-[10px] mt-1.5 px-2 py-0.5 rounded-full inline-block font-medium',
                                                        isPaid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                    )}>
                                                        {isPaid ? 'Đã thanh toán hết' : 'Chưa thanh toán'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className={clsx('text-sm font-semibold mb-1.5', u === 'urgent' ? 'text-red-600' : u === 'warning' ? 'text-orange-600' : 'text-gray-900')}>
                                                        {formatDelivery(order.deliveryDateTime)}
                                                    </p>
                                                    {order.status !== 'completed' && (
                                                        <span className={clsx(
                                                            'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md border',
                                                            isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                                                        )}>
                                                            {isOverdue ? '⚠️ ' : '⏳ '}{countdown}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5">
                                                        <p className="text-xs text-gray-600"><span className="text-gray-400 md:inline hidden">Thợ: </span><span className="font-medium text-gray-900">{employeeMap[order.floristId] ?? '—'}</span></p>
                                                        <p className="text-xs text-gray-600"><span className="text-gray-400 md:inline hidden">Vận đơn: </span><span className="font-medium text-gray-900">{employeeMap[order.shipperId] ?? 'Trống'}</span></p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                                                        className={clsx(
                                                            "border text-xs font-semibold rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-pink-400 appearance-none cursor-pointer transition-colors",
                                                            order.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                                                                order.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' :
                                                                    order.status === 'delivering' ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' :
                                                                        'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                        )}
                                                    >
                                                        {COLUMNS.map(c => (
                                                            <option key={c.status} value={c.status}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal Edit Order */}
            {selectedOrderForModal && (
                <OrderDetailModal
                    order={selectedOrderForModal}
                    onClose={() => setSelectedOrderForModal(null)}
                    onSaved={() => { }}
                />
            )}
        </div>
    );
}
