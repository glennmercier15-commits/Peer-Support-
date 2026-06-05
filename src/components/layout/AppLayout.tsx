import React, { useState, useEffect, FC } from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  Target, 
  ShieldAlert, 
  Search, 
  HeartPulse, 
  BarChart2, 
  MessageSquare,
  Sparkles,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { AppUser } from '../../types';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarItemProps {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

const SidebarItem: FC<SidebarItemProps> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full p-3 my-1 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-teal-500 text-white shadow-lg shadow-teal-200' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-teal-600'
    }`}
  >
    <Icon className="w-5 h-5 min-w-[20px]" />
    {!collapsed && <span className="ml-3 font-medium text-sm">{label}</span>}
  </button>
);

export const AppLayout = ({ children }: { 
  children: React.ReactNode;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);

  const activeTab = location.pathname === '/' ? 'dashboard' : location.pathname.split('/')[1];

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setUser({ id: u.uid, ...userDoc.data() } as AppUser);
        }
      } else {
        setUser(null);
      }
    });
    return unsub;
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'peers', label: 'Peer Directory', icon: Users },
    { id: 'interactions', label: 'Interactions', icon: Calendar },
    { id: 'goals', label: 'Goal Tracking', icon: Target },
    { id: 'safety', label: 'Safety Plans', icon: ShieldAlert },
    { id: 'resources', label: 'Resources', icon: Search },
    { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
    { id: 'chat', label: 'Peer Chat', icon: MessageSquare },
    { id: 'wellness', label: 'Wellness Hub', icon: HeartPulse },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const handleLogout = () => signOut(auth);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 80 : 260 }}
        className={`fixed inset-y-0 left-0 bg-white border-r border-slate-200 z-50 lg:relative transition-all duration-300 transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center justify-between mb-8 px-2 h-16">
            {!collapsed && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mr-3 text-white font-bold text-sm">P</div>
                <h1 className="text-xl font-semibold tracking-tight text-teal-900">
                  PeerConnect <span className="font-light">Pro</span>
                </h1>
              </div>
            )}
            {collapsed && (
               <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center mx-auto text-white font-bold">
                P
              </div>
            )}
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 hover:bg-slate-100 rounded-md text-slate-400 mt-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            {navItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeTab === item.id}
                collapsed={collapsed}
                onClick={() => {
                  navigate(item.id === 'dashboard' ? '/' : `/${item.id}`);
                  setMobileOpen(false);
                }}
              />
            ))}
          </nav>

          <div className="pt-4 mt-4 border-t border-slate-100">
            {!collapsed && user && (
              <div className="mb-4 px-3 py-2 bg-slate-50 rounded-xl flex items-center">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs mr-3">
                  {user.name.charAt(0)}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
              </div>
            )}
            <button
               onClick={handleLogout}
               className="flex items-center w-full p-3 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {!collapsed && <span className="ml-3 font-medium text-sm">Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30">
          <button 
            className="lg:hidden p-2 -ml-2 text-slate-500"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:flex items-center justify-end space-x-6">
             <div className="relative max-w-xs w-full hidden md:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm focus:ring-1 focus:ring-teal-500 focus:outline-none transition-all"
               />
             </div>

             <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-100 rounded-full hidden sm:flex text-teal-700">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider">Wellness: Optimal</span>
             </div>
             
             <button className="relative p-2 text-slate-400 hover:text-teal-600 transition-colors">
               <Bell className="w-5 h-5" />
               <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
             </button>
             
             <div className="flex items-center pl-4 border-l border-slate-100 h-8">
               <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs shadow-sm overflow-hidden border border-white">
                 {user?.name?.charAt(0) || '?'}
               </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
};
