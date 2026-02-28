import React, { useState, useCallback } from 'react';
import { Settings as SettingsIcon, Plus, X, Tag, Layers } from 'lucide-react';
import { getSettings, saveSettings } from '../lib/db';
import type { AppSettings } from '../types';
import toast from 'react-hot-toast';

export default function Settings() {
    const [settings, setSettings] = useState<AppSettings>(() => getSettings());
    const [newSource, setNewSource] = useState('');
    const [newProductType, setNewProductType] = useState('');

    const persist = useCallback((updated: AppSettings) => {
        saveSettings(updated);
        setSettings(updated);
        toast.success('Đã lưu thay đổi');
    }, []);

    function addSource() {
        const val = newSource.trim();
        if (!val) return;
        if (settings.sources.includes(val)) {
            toast.error('Nguồn này đã tồn tại');
            return;
        }
        persist({ ...settings, sources: [...settings.sources, val] });
        setNewSource('');
    }

    function removeSource(s: string) {
        persist({ ...settings, sources: settings.sources.filter(x => x !== s) });
    }

    function addProductType() {
        const val = newProductType.trim();
        if (!val) return;
        if (settings.productTypes.includes(val)) {
            toast.error('Loại sản phẩm này đã tồn tại');
            return;
        }
        persist({ ...settings, productTypes: [...settings.productTypes, val] });
        setNewProductType('');
    }

    function removeProductType(t: string) {
        persist({ ...settings, productTypes: settings.productTypes.filter(x => x !== t) });
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                    <SettingsIcon size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Cài Đặt Hệ Thống</h1>
                    <p className="text-xs text-gray-400">Quản lý danh mục dữ liệu</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Customer Sources */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Tag size={16} className="text-blue-500" />
                        <h2 className="font-semibold text-gray-800">Nguồn khách hàng</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
                        {settings.sources.map(s => (
                            <span
                                key={s}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-xl border border-blue-100"
                            >
                                {s}
                                <button
                                    onClick={() => removeSource(s)}
                                    className="hover:text-red-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {settings.sources.length === 0 && (
                            <p className="text-sm text-gray-400 italic">Chưa có nguồn nào</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newSource}
                            onChange={e => setNewSource(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSource()}
                            placeholder="Thêm nguồn mới (VD: TikTok)..."
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            onClick={addSource}
                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            <Plus size={14} />
                            Thêm
                        </button>
                    </div>
                </div>

                {/* Product Types */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Layers size={16} className="text-pink-500" />
                        <h2 className="font-semibold text-gray-800">Loại sản phẩm</h2>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4 min-h-[36px]">
                        {settings.productTypes.map(t => (
                            <span
                                key={t}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 text-pink-700 text-sm font-medium rounded-xl border border-pink-100"
                            >
                                {t}
                                <button
                                    onClick={() => removeProductType(t)}
                                    className="hover:text-red-500 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                        {settings.productTypes.length === 0 && (
                            <p className="text-sm text-gray-400 italic">Chưa có loại sản phẩm nào</p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newProductType}
                            onChange={e => setNewProductType(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addProductType()}
                            placeholder="Thêm loại mới (VD: Lẵng hoa)..."
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                        />
                        <button
                            onClick={addProductType}
                            className="flex items-center gap-1.5 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                            <Plus size={14} />
                            Thêm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
