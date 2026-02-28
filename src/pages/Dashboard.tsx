import React, { useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, PiggyBank, Clock, AlertTriangle } from 'lucide-react';
import { getOrders } from '../lib/db';
import type { OrderStatus } from '../types';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

function fmt(n: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

const STATUS_COLUMNS: { status: OrderStatus; label: string; color: string; bg: string; dot: string }[] = [
    { status: 'new', label: 'Mới tạo', color: 'text-blue-700', bg: 'bg-blue-50 hover:bg-blue-100', dot: '#3b82f6' },
    { status: 'in_progress', label: 'Đang làm', color: 'text-amber-700', bg: 'bg-amber-50 hover:bg-amber-100', dot: '#f59e0b' },
    { status: 'delivering', label: 'Đang giao', color: 'text-violet-700', bg: 'bg-violet-50 hover:bg-violet-100', dot: '#8b5cf6' },
    { status: 'completed', label: 'Hoàn thành', color: 'text-emerald-700', bg: 'bg-emerald-50 hover:bg-emerald-100', dot: '#10b981' },
];

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981'];

type TimeFilter = 'today' | 'this_week' | 'this_month' | 'all';

export default function Dashboard() {
    const navigate = useNavigate();
    const [, setTick] = useState(0);
    const refresh = useCallback(() => setTick(t => t + 1), []);

    const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');

    const orders = getOrders();
    const timeFrame = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        if (timeFilter === 'today') {
            return {
                start: d,
                end: new Date(d.getTime() + 86400000)
            };
        }
        if (timeFilter === 'this_week') {
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
            const start = new Date(d.setDate(diff));
            start.setHours(0, 0, 0, 0);
            return {
                start,
                end: new Date(start.getTime() + 7 * 86400000)
            };
        }
        if (timeFilter === 'this_month') {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            return {
                start,
                end: new Date(d.getFullYear(), d.getMonth() + 1, 1)
            };
        }
        return { start: new Date(0), end: new Date(9999, 11, 31) };
    }, [timeFilter]);

    // Stats
    const filteredOrders = useMemo(() => {
        return orders.filter(o => {
            const d = new Date(o.createdAt);
            return d >= timeFrame.start && d < timeFrame.end;
        });
    }, [orders, timeFrame]);

    const totalRevenue = filteredOrders.reduce((s, o) => s + o.orderValue, 0);
    const totalDeposit = filteredOrders.filter(o => o.status !== 'completed').reduce((s, o) => s + o.deposit, 0);
    const totalRemaining = filteredOrders.filter(o => o.status !== 'completed').reduce((s, o) => s + (o.orderValue - o.deposit), 0);

    const urgentOrders = orders.filter(o => {
        if (o.status === 'completed') return false;
        const diff = (new Date(o.deliveryDateTime).getTime() - Date.now()) / 60000;
        return diff < 120;
    });

    // Status counts
    const statusCounts = Object.fromEntries(
        STATUS_COLUMNS.map(c => [c.status, orders.filter(o => o.status === c.status).length])
    );

    // Bar chart: last 7 days revenue based strictly on today
    const nowLocal = new Date();
    const todayStartBar = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate());
    const barData = Array.from({ length: 7 }, (_, i) => {
        const day = new Date(todayStartBar.getTime() - (6 - i) * 86400000);
        const nextDay = new Date(day.getTime() + 86400000);
        const label = `${day.getDate()}/${day.getMonth() + 1}`;
        const rev = orders
            .filter(o => {
                const d = new Date(o.createdAt);
                return d >= day && d < nextDay;
            })
            .reduce((s, o) => s + o.orderValue, 0);
        return { label, rev };
    });

    // Pie chart
    const pieData = STATUS_COLUMNS.map((c, i) => ({
        name: c.label,
        value: statusCounts[c.status] ?? 0,
        color: PIE_COLORS[i],
    })).filter(d => d.value > 0);

    const RADIAN = Math.PI / 180;
    function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
        const r = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + r * Math.cos(-midAngle * RADIAN);
        const y = cy + r * Math.sin(-midAngle * RADIAN);
        if (percent < 0.05) return null;
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    }

    const statCards = [
        {
            label: 'Tổng Doanh Thu',
            value: fmt(totalRevenue),
            sub: `${filteredOrders.length} đơn bán được`,
            icon: DollarSign,
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            valueCls: 'text-emerald-600',
        },
        {
            label: 'Đã Thu (Cọc)',
            value: fmt(totalDeposit),
            sub: `Còn lại: ${fmt(totalRemaining)}`,
            icon: PiggyBank,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            valueCls: 'text-blue-600',
        },
        {
            label: 'Tổng Số Đơn',
            value: String(filteredOrders.length),
            sub: 'Đơn được tạo trong kỳ',
            icon: Clock,
            iconBg: 'bg-violet-100',
            iconColor: 'text-violet-600',
            valueCls: 'text-violet-700',
        },
        {
            label: 'Cần Chú Ý',
            value: String(urgentOrders.length),
            sub: `${urgentOrders.length} khẩn cấp, ${urgentOrders.filter(o => { const d = (new Date(o.deliveryDateTime).getTime() - Date.now()) / 60000; return d >= 120 && d < 240; }).length} cảnh báo`,
            icon: AlertTriangle,
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            valueCls: 'text-red-600',
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Trang Quản Trị</h1>
                    <p className="text-sm text-gray-400 mt-0.5">
                        Tổng quan hoạt động kinh doanh
                    </p>
                </div>
                <select
                    value={timeFilter}
                    onChange={e => setTimeFilter(e.target.value as TimeFilter)}
                    className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white cursor-pointer shadow-sm text-gray-700 w-full sm:w-auto"
                >
                    <option value="today">Hôm nay</option>
                    <option value="this_week">Tuần này</option>
                    <option value="this_month">Tháng này</option>
                    <option value="all">Tất cả thời gian</option>
                </select>
            </div>

            {/* Row 1: Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(card => (
                    <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-xs font-medium text-gray-500">{card.label}</p>
                            <div className={`w-8 h-8 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                                <card.icon size={16} className={card.iconColor} />
                            </div>
                        </div>
                        <p className={`text-xl font-bold ${card.valueCls} mb-1`}>{card.value}</p>
                        <p className="text-[11px] text-gray-400">{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Row 2: Status Cards (clickable) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATUS_COLUMNS.map(col => (
                    <button
                        key={col.status}
                        onClick={() => navigate(`/orders?status=${col.status}`)}
                        className={`${col.bg} rounded-2xl p-5 text-left transition-all cursor-pointer border border-transparent hover:border-current hover:shadow-md group`}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: col.dot }} />
                            <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                        </div>
                        <p className={`text-3xl font-bold ${col.color}`}>{statusCounts[col.status] ?? 0}</p>
                        <p className="text-[11px] text-gray-400 mt-1 group-hover:text-gray-600 transition-colors">Xem đơn →</p>
                    </button>
                ))}
            </div>

            {/* Row 3: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Bar Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Doanh Thu 7 Ngày Gần Nhất</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                                tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                            <Tooltip
                                formatter={(v: number | undefined) => [fmt(v ?? 0), 'Doanh thu']}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}
                            />
                            <Bar dataKey="rev" fill="#f472b6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Pie Chart */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Phân Bố Trạng Thái Đơn Hàng</h3>
                    {pieData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Chưa có dữ liệu</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={75}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderCustomLabel}
                                >
                                    {pieData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}
