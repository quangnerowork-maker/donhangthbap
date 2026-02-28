import { getOrders, getEmployees, setOrders, setEmployees, initSettings } from './db';
import type { Order, Employee } from '../types';

const EMPLOYEES: Employee[] = [
    { id: 'emp-admin', name: 'Quản trị viên', role: 'lead_florist', username: 'admin', password: '123', isAdmin: true },
    { id: 'emp-1', name: 'Mai Anh', role: 'lead_florist', username: 'maianh', password: '123', isAdmin: false },
    { id: 'emp-2', name: 'Lan Hương', role: 'florist', username: 'lanhuong', password: '123', isAdmin: false },
    { id: 'emp-3', name: 'Thu Hiền', role: 'florist', username: 'thuhien', password: '123', isAdmin: false },
    { id: 'emp-4', name: 'Minh Tuấn', role: 'dispatcher', username: 'minhtuan', password: '123', isAdmin: false },
    { id: 'emp-5', name: 'Văn Nam', role: 'dispatcher', username: 'vannam', password: '123', isAdmin: false },
    { id: 'emp-6', name: 'Hoàng Long', role: 'dispatcher', username: 'hoanglong', password: '123', isAdmin: false },
];

// Reference time for seed data
const NOW = new Date();

function isoOffset(hoursFromNow: number): string {
    const d = new Date(NOW.getTime() + hoursFromNow * 60 * 60 * 1000);
    return d.toISOString();
}

const ORDERS: Order[] = [
    {
        id: `${formatDatePrefix(NOW)}-001`,
        customerName: 'Nguyễn Thị Hoa',
        customerPhone: '0901234567',
        customerSource: 'Zalo',
        productType: 'Bó hoa',
        productDetails: 'Hoa hồng đỏ, dây nơ hồng, báo Hàn Quốc',
        orderValue: 350000,
        deposit: 150000,
        deliveryDateTime: isoOffset(1),
        status: 'new',
        floristId: 'emp-1',
        shipperId: 'emp-4',
        notes: 'Hoa hồng đỏ, giao trước 14h',
        createdAt: isoOffset(-2),
        createdBy: 'admin',
    },
    {
        id: `${formatDatePrefix(NOW)}-002`,
        customerName: 'Trần Văn Minh',
        customerPhone: '0987654321',
        customerSource: 'Facebook',
        productType: 'Giỏ hoa',
        productDetails: 'Hoa cúc vàng mix cẩm chướng',
        orderValue: 550000,
        deposit: 550000,
        deliveryDateTime: isoOffset(5),
        status: 'in_progress',
        floristId: 'emp-2',
        shipperId: 'emp-5',
        notes: 'Hoa cúc vàng, chúc mừng sinh nhật',
        createdAt: isoOffset(-5),
        createdBy: 'admin',
    },
    {
        id: `${formatDatePrefix(NOW)}-003`,
        customerName: 'Lê Thị Lan',
        customerPhone: '0912345678',
        customerSource: 'Instagram',
        productType: 'Kệ hoa',
        productDetails: 'Kệ 3 tầng, hoa màu trắng đỏ',
        orderValue: 1200000,
        deposit: 500000,
        deliveryDateTime: isoOffset(8),
        status: 'delivering',
        floristId: 'emp-3',
        shipperId: 'emp-6',
        notes: 'Kệ hoa khai trương, giao tận nơi',
        createdAt: isoOffset(-8),
        createdBy: 'admin',
    },
    {
        id: `${formatDatePrefixDaysAgo(1)}-001`,
        customerName: 'Phạm Thị Thu',
        customerPhone: '0933333333',
        customerSource: 'Giới thiệu',
        productType: 'Bó hoa',
        productDetails: 'Hoa tulip trắng',
        orderValue: 280000,
        deposit: 280000,
        deliveryDateTime: isoOffset(-24),
        status: 'completed',
        floristId: 'emp-1',
        shipperId: 'emp-4',
        notes: '',
        createdAt: isoOffset(-30),
        createdBy: 'maianh',
    },
];

function formatDatePrefix(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
}

function formatDatePrefixDaysAgo(daysAgo: number): string {
    const d = new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return formatDatePrefix(d);
}

export function seedIfEmpty(): void {
    const employees = getEmployees();
    const orders = getOrders();

    // Ensure we have at least the admin account if it's missing
    const hasAdmin = employees.some(e => e.isAdmin || e.username === 'admin');
    if (!hasAdmin) {
        // Find admin from SEED data or use the first admin found
        const adminFromSeed = EMPLOYEES.find(e => e.isAdmin) || EMPLOYEES[0];
        setEmployees([...employees, adminFromSeed]);
    } else if (employees.length === 0) {
        setEmployees(EMPLOYEES);
    }

    if (orders.length === 0) {
        setOrders(ORDERS);
    }
    initSettings();
}

export function resetAllData(): void {
    setEmployees(EMPLOYEES);
    setOrders(ORDERS);
}
