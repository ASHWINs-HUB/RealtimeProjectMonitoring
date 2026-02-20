import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, LogOut, Settings, ShieldCheck } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export const RoleSwitcher = () => {
    const { user, updateUser } = useAuthStore();
    const roles = ['admin', 'stakeholder', 'hr', 'manager', 'team_leader', 'developer'];

    if (user?.role !== 'admin') return null;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all border border-slate-800 shadow-xl shadow-slate-900/10 group">
                    <ShieldCheck size={14} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span>Switch Role</span>
                    <ChevronDown size={12} className="opacity-50" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="z-50 min-w-[160px] bg-white rounded-2xl p-2 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                    {roles.map((role) => (
                        <DropdownMenu.Item
                            key={role}
                            onClick={() => updateUser({ role })}
                            className={`flex items-center px-3 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl cursor-pointer outline-none transition-colors ${user.role === role ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {role.replace('_', ' ')}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

export const ProfileDropdown = () => {
    const { user, logout } = useAuthStore();

    const roleColors = {
        admin: 'from-gray-900 to-black',
        stakeholder: 'from-blue-600 to-cyan-500',
        hr: 'from-violet-500 to-purple-600',
        manager: 'from-blue-500 to-indigo-600',
        team_leader: 'from-teal-500 to-cyan-600',
        developer: 'from-orange-500 to-amber-600'
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-3 p-1 pr-3 rounded-2xl hover:bg-slate-50 transition-all group">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${roleColors[user?.role] || 'from-indigo-600 to-violet-600'} flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:scale-105 transition-transform`}>
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="text-left hidden sm:block">
                        <p className="text-[11px] font-black text-slate-900 leading-none mb-0.5">{user?.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{user?.role?.replace('_', ' ')}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 opacity-50 group-hover:opacity-100 transition-all" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="z-50 min-w-[200px] bg-white rounded-2xl p-2 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-3 mb-2 border-b border-slate-50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Session Identity</p>
                        <p className="text-sm font-black text-slate-900">{user?.email}</p>
                    </div>

                    <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold text-slate-600 rounded-xl cursor-pointer outline-none hover:bg-slate-50 hover:text-indigo-600 transition-all group">
                        <User size={16} className="opacity-50 group-hover:opacity-100" />
                        Profile Settings
                    </DropdownMenu.Item>

                    <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-bold text-slate-600 rounded-xl cursor-pointer outline-none hover:bg-slate-50 hover:text-indigo-600 transition-all group">
                        <Settings size={16} className="opacity-50 group-hover:opacity-100" />
                        Security Preference
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-slate-50 my-2" />

                    <DropdownMenu.Item
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-black text-rose-500 rounded-xl cursor-pointer outline-none hover:bg-rose-50 transition-all group"
                    >
                        <LogOut size={16} />
                        TERMINATE SESSION
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};
