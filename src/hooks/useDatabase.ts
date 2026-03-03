import { useState, useEffect } from 'react';
import { subscribeToOrders, subscribeToEmployees, subscribeToSettings } from '../lib/db';
import type { Order, Employee, AppSettings } from '../types';

export function useOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToOrders((data) => {
            setOrders(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { orders, loading };
}

export function useEmployees() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToEmployees((data) => {
            setEmployees(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { employees, loading };
}

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = subscribeToSettings((data) => {
            setSettings(data);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return { settings, loading };
}
