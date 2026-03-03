export type OrderStatus = 'new' | 'in_progress' | 'delivering' | 'completed';
export type EmployeeRole = 'admin' | 'lead_florist' | 'florist' | 'dispatcher';

export interface Order {
    id: string;
    customerName: string;
    customerPhone?: string;
    customerSource: string;
    productType: string;
    productDetails?: string;
    orderValue: number;
    deposit: number;
    deliveryDateTime: string; // ISO string
    status: OrderStatus;
    floristId: string;
    shipperId: string; // Keep variable name backwards compatible, UI will show 'Người vận đơn'
    notes?: string;
    flowerImage?: string;
    createdAt: string; // ISO string
    createdBy?: string;
}

export interface Employee {
    id: string;
    name: string;
    role: EmployeeRole;
    username: string;
    password: string;
    isAdmin: boolean;
}

export interface AppSettings {
    sources: string[];
    productTypes: string[];
}
