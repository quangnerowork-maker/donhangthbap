import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    PlusCircle,
    Flower2,
    Settings,
    LogOut,
    Menu,
    X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout() {
    const navigate = useNavigate();
    const { user, logout, isAdmin } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const navItems = [
        ...((isAdmin || user?.role === 'lead_florist') ? [{ to: '/', label: 'Trang Quản Trị', icon: LayoutDashboard, end: true }] : []),
        { to: '/orders', label: 'Quản Lý Đơn Hàng', icon: ShoppingBag, end: false },
        ...(isAdmin ? [{ to: '/employees', label: 'Hệ Thống Nhân Sự', icon: Users, end: false }] : []),
        ...(isAdmin ? [{ to: '/settings', label: 'Cài Đặt Hệ Thống', icon: Settings, end: false }] : []),
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* ── MOBILE OVERLAY ─────────────────────────────── */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm"
                    onClick={closeMobileMenu}
                />
            )}

            {/* ── SIDEBAR (Drawer on mobile, fixed on desktop) ────── */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 shadow-xl transition-transform duration-300 md:relative md:translate-x-0 md:shadow-none md:z-10 flex flex-col shrink-0",
                isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo and close button for mobile */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-md">
                            <Flower2 size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm leading-tight">Tiệm Hoa</p>
                            <p className="text-xs text-gray-400">Hệ thống quản lý</p>
                        </div>
                    </div>
                    <button
                        onClick={closeMobileMenu}
                        className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={closeMobileMenu}
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
                {(isAdmin || user?.role === 'lead_florist' || user?.role === 'dispatcher') && (
                    <div className="px-4 pb-3">
                        <button
                            onClick={() => {
                                closeMobileMenu();
                                navigate('/create');
                            }}
                            className="w-full h-11 flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            <PlusCircle size={16} />
                            Tạo đơn mới
                        </button>
                    </div>
                )}

                {/* User info + Logout */}
                <div className="px-4 pb-5 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-2.5 mb-3 px-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                            {user?.name?.charAt(0) ?? 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                                {user?.role === 'admin' || user?.isAdmin ? 'QTV' :
                                    user?.role === 'lead_florist' ? 'Thợ chính' :
                                        user?.role === 'florist' ? 'Thợ cắm hoa' :
                                            'Người vận đơn'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full h-11 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                    >
                        <LogOut size={16} />
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* ── MAIN CONTENT ──────────────────────────────────── */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Updated Mobile Topbar */}
                <header className="flex md:hidden items-center justify-between px-4 h-16 bg-white border-b border-gray-100 shadow-sm shrink-0 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center">
                                <Flower2 size={16} className="text-white" />
                            </div>
                            <span className="font-bold text-gray-900 text-base">Tiệm Hoa</span>
                        </div>
                    </div>
                    {user && (
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 text-[10px] font-bold">
                            {user.name?.charAt(0)}
                        </div>
                    )}
                </header>

                {/* Page */}
                <main className="flex-1 overflow-y-auto min-w-0">
                    <div className="p-4 md:p-6 lg:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
