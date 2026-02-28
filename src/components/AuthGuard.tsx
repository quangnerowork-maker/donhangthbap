import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AuthGuardProps {
    children: React.ReactNode;
    adminOnly?: boolean;
    floristDisallowed?: boolean;
}

export default function AuthGuard({ children, adminOnly = false, floristDisallowed = false }: AuthGuardProps) {
    const { user, isAdmin } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
        // Show toast via effect — but since this is a render we use a workaround
        // Schedule the toast outside render cycle
        setTimeout(() => {
            toast.error('Bạn không có quyền truy cập trang này');
        }, 0);
        return <Navigate to="/orders" replace />;
    }

    if (floristDisallowed && user.role === 'florist' && !isAdmin) {
        setTimeout(() => {
            toast.error('Thợ cắm hoa không được phép truy cập trang này');
        }, 0);
        return <Navigate to="/orders" replace />;
    }

    return <>{children}</>;
}
