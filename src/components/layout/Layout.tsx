import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    PlusCircle,
    Flower2,
    Settings,
    LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    const navItems = [
        ...(isAdmin ? [{ to: '/', label: 'Trang Quản Trị', icon: LayoutDashboard, end: true }] : []),
        { to: '/orders', label: 'Quản Lý Đơn Hàng', icon: ShoppingBag, end: false },
        ...(isAdmin ? [{ to: '/employees', label: 'Hệ Thống Nhân Sự', icon: Users, end: false }] : []),
        ...(isAdmin ? [{ to: '/settings', label: 'Cài Đặt Hệ Thống', icon: Settings, end: false }] : []),
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* ── SIDEBAR (desktop) ─────────────────────────────── */}
            <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 shadow-sm shrink-0">
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-md">
                        <Flower2 size={18} className="text-white" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">Tiệm Hoa</p>
                        <p className="text-xs text-gray-400">Hệ thống quản lý</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 pt-4 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-pink-50 text-pink-600'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={18}
                                        className={isActive ? 'text-pink-600' : 'text-gray-400'}
                                    />
                                    {item.label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Create button */}
                {user?.role !== 'florist' && (
                    <div className="px-4 pb-3">
                        <button
                            onClick={() => navigate('/create')}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            <PlusCircle size={16} />
                            Tạo đơn mới
                        </button>
                    </div>
                )}

                {/* User info + Logout */}
                <div className="px-4 pb-5 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2.5 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.charAt(0) ?? 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-[10px] text-gray-400">{user?.isAdmin ? 'Quản trị viên' : user?.role === 'florist' ? 'Thợ cắm hoa' : 'Shipper'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={14} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ──────────────────────────────────── */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Mobile Topbar */}
                <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
                            <Flower2 size={15} className="text-white" />
                        </div>
                        <span className="font-bold text-gray-900 text-sm">Tiệm Hoa</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 py-1.5 px-3 text-gray-500 hover:text-red-500 text-xs rounded-lg"
                    >
                        <LogOut size={13} />
                    </button>
                </header>

                {/* Page */}
                <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                    <Outlet />
                </main>

                {/* Mobile Bottom Tabs */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 flex bg-white border-t border-gray-100 shadow-lg z-50">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                clsx(
                                    'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                                    isActive ? 'text-pink-600' : 'text-gray-400'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon size={20} className={isActive ? 'text-pink-600' : 'text-gray-400'} />
                                    <span className="text-[10px]">{item.label.split(' ').pop()}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                    {user?.role !== 'florist' && (
                        <NavLink
                            to="/create"
                            className={({ isActive }) =>
                                clsx(
                                    'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                                    isActive ? 'text-pink-600' : 'text-gray-400'
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <PlusCircle size={20} className={isActive ? 'text-pink-600' : 'text-gray-400'} />
                                    <span className="text-[10px]">Tạo mới</span>
                                </>
                            )}
                        </NavLink>
                    )}
                </nav>
            </div>
        </div>
    );
}
