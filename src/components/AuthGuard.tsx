import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AuthGuardProps {
    children: React.ReactNode;
    adminOnly?: boolean;
    adminOrLeadOnly?: boolean;
    floristDisallowed?: boolean;
}

export default function AuthGuard({ children, adminOnly = false, adminOrLeadOnly = false, floristDisallowed = false }: AuthGuardProps) {
    const { user, isAdmin } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    const isLead = user.role === 'lead_florist';

    if (adminOnly && !isAdmin) {
        setTimeout(() => {
            toast.error('Bạn không có quyền truy cập trang này');
        }, 0);
        return <Navigate to="/orders" replace />;
    }

    if (adminOrLeadOnly && !isAdmin && !isLead) {
        setTimeout(() => {
            toast.error('Chỉ Quản trị viên hoặc Thợ chính mới có quyền truy cập');
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
