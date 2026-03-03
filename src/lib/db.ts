import { db } from './firebase';
import {
    collection,
    getDocs,
    getDoc,
    setDoc,
    doc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';
import type { Order, Employee, AppSettings, EmployeeRole } from '../types';

const ORDERS_COL = 'orders';
const EMPLOYEES_COL = 'employees';
const SETTINGS_COL = 'settings';
const SESSION_KEY = 'thb_session';

// ─── ORDERS ────────────────────────────────────────────────
// Note: We'll use a snapshot-based hook later for the UI.
// These are direct one-off async getters.
export async function getOrders(): Promise<Order[]> {
    const querySnapshot = await getDocs(collection(db, ORDERS_COL));
    return querySnapshot.docs.map(doc => doc.data() as Order);
}

export async function saveOrder(order: Order): Promise<void> {
    await setDoc(doc(db, ORDERS_COL, order.id), order);
}

export async function updateOrder(updated: Order): Promise<void> {
    const orderRef = doc(db, ORDERS_COL, updated.id);
    await setDoc(orderRef, updated);
}

export async function deleteOrder(id: string): Promise<void> {
    await deleteDoc(doc(db, ORDERS_COL, id));
}

// ─── EMPLOYEES ─────────────────────────────────────────────
export async function getEmployees(): Promise<Employee[]> {
    const querySnapshot = await getDocs(collection(db, EMPLOYEES_COL));
    return querySnapshot.docs.map(doc => doc.data() as Employee);
}

export async function saveEmployee(emp: Employee): Promise<void> {
    await setDoc(doc(db, EMPLOYEES_COL, emp.id), emp);
}

export async function updateEmployee(updated: Employee): Promise<void> {
    await setDoc(doc(db, EMPLOYEES_COL, updated.id), updated);
}

export async function deleteEmployee(id: string): Promise<void> {
    await deleteDoc(doc(db, EMPLOYEES_COL, id));
}

// ─── AUTH / SESSION ─────────────────────────────────────────
// For login, we still fetch all employees and find locally (since it's a small shop management tool)
export async function login(username: string, password: string): Promise<Employee | null> {
    const querySnapshot = await getDocs(collection(db, EMPLOYEES_COL));
    const emps = querySnapshot.docs.map(doc => doc.data() as Employee);

    // Find matching credentials (trim username and be case-insensitive for username)
    const found = emps.find(
        e => e.username.toLowerCase() === username.trim().toLowerCase() && e.password === password
    );

    // CRITICAL FIX: Ensure 'admin' user always has the 'admin' role and isAdmin flag
    if (found && found.username.toLowerCase() === 'admin') {
        if (found.role !== 'admin' || !found.isAdmin) {
            const updatedAdmin = { ...found, role: 'admin' as EmployeeRole, isAdmin: true };
            await updateEmployee(updatedAdmin);
            return updatedAdmin;
        }
    }

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

export async function getSettings(): Promise<AppSettings> {
    const docSnap = await getDoc(doc(db, SETTINGS_COL, 'global'));
    if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
    }
    return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
    await setDoc(doc(db, SETTINGS_COL, 'global'), settings);
}

export async function initSettings(): Promise<void> {
    const docRef = doc(db, SETTINGS_COL, 'global');
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        await setDoc(docRef, DEFAULT_SETTINGS);
    }
}

// ─── ORDER ID GENERATOR ────────────────────────────────────
// This needs to be async now because it depends on existing orders
export async function generateOrderId(): Promise<string> {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const prefix = `${yyyy}${mm}${dd}`;

    const orders = await getOrders();
    const todaysOrders = orders.filter(o => o.id.startsWith(prefix));
    const seq = String(todaysOrders.length + 1).padStart(3, '0');
    return `${prefix}-${seq}`;
}

// --- REAL-TIME LISTENERS ---
export function subscribeToOrders(callback: (orders: Order[]) => void) {
    return onSnapshot(collection(db, ORDERS_COL), (snapshot) => {
        const orders = snapshot.docs.map(doc => doc.data() as Order);
        callback(orders);
    });
}

export function subscribeToEmployees(callback: (employees: Employee[]) => void) {
    return onSnapshot(collection(db, EMPLOYEES_COL), (snapshot) => {
        const emps = snapshot.docs.map(doc => doc.data() as Employee);
        callback(emps);
    });
}

export function subscribeToSettings(callback: (settings: AppSettings) => void) {
    return onSnapshot(doc(db, SETTINGS_COL, 'global'), (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as AppSettings);
        } else {
            callback(DEFAULT_SETTINGS);
        }
    });
}
