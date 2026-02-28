import type { Order, Employee, AppSettings } from '../types';

const ORDERS_KEY = 'thb_orders';
const EMPLOYEES_KEY = 'thb_employees';
const SESSION_KEY = 'thb_session';
const SETTINGS_KEY = 'thb_settings';

// ─── ORDERS ────────────────────────────────────────────────
export function getOrders(): Order[] {
    try {
        const raw = localStorage.getItem(ORDERS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveOrder(order: Order): void {
    const orders = getOrders();
    orders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function updateOrder(updated: Order): void {
    const orders = getOrders().map(o => o.id === updated.id ? updated : o);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function deleteOrder(id: string): void {
    const orders = getOrders().filter(o => o.id !== id);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function setOrders(orders: Order[]): void {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// ─── EMPLOYEES ─────────────────────────────────────────────
export function getEmployees(): Employee[] {
    try {
        const raw = localStorage.getItem(EMPLOYEES_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveEmployee(emp: Employee): void {
    const emps = getEmployees();
    emps.push(emp);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(emps));
}

export function updateEmployee(updated: Employee): void {
    const emps = getEmployees().map(e => e.id === updated.id ? updated : e);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(emps));
}

export function deleteEmployee(id: string): void {
    const emps = getEmployees().filter(e => e.id !== id);
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(emps));
}

export function setEmployees(emps: Employee[]): void {
    localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(emps));
}

// ─── AUTH / SESSION ─────────────────────────────────────────
export function login(username: string, password: string): Employee | null {
    const emps = getEmployees();
    const found = emps.find(
        e => e.username === username.trim() && e.password === password
    );
    return found ?? null;
}

export function getSession(): Employee | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function setSession(emp: Employee): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(emp));
}

export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

// ─── SETTINGS ───────────────────────────────────────────────
const DEFAULT_SETTINGS: AppSettings = {
    sources: ['Zalo', 'Facebook', 'Instagram', 'Giới thiệu', 'Khác'],
    productTypes: ['Bó hoa', 'Giỏ hoa', 'Kệ hoa', 'Khác'],
};

export function getSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function initSettings(): void {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    }
}

// ─── ORDER ID GENERATOR ────────────────────────────────────
export function generateOrderId(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `${yyyy}${mm}${dd}`;

    const orders = getOrders();
    const todaysOrders = orders.filter(o => o.id.startsWith(prefix));
    const seq = String(todaysOrders.length + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
}
