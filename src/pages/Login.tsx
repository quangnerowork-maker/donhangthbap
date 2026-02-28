import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Flower2, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const { user, login, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Already logged in – redirect to appropriate home
    if (user) {
        return <Navigate to={isAdmin ? '/' : '/orders'} replace />;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!username.trim() || !password) {
            toast.error('Vui lòng nhập đầy đủ thông tin');
            return;
        }
        setLoading(true);
        setTimeout(() => {
            const success = login(username, password);
            setLoading(false);
            if (success) {
                toast.success('Đăng nhập thành công! 🌸');
                const authed = JSON.parse(localStorage.getItem('thb_session') || 'null');
                navigate(authed?.isAdmin ? '/' : '/orders', { replace: true });
            } else {
                toast.error('Sai tên đăng nhập hoặc mật khẩu');
            }
        }, 300);
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center shadow-xl mx-auto mb-4">
                        <Flower2 size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Tiệm Hoa</h1>
                    <p className="text-gray-500 text-sm mt-1">Hệ thống quản lý</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-pink-100 border border-pink-50 p-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">Đăng nhập</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="admin"
                                autoFocus
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all bg-gray-50 focus:bg-white pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-pink-200 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            ) : (
                                <LogIn size={16} />
                            )}
                            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center">
                            Tài khoản quản trị: <span className="font-mono text-gray-600">admin / 123</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
