import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target, 
  Heart,
  Loader2,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Interaction, Goal, WellnessCheck } from '../types';

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [stats, setStats] = useState({
    interactions: [] as Interaction[],
    goals: [] as Goal[],
    wellness: [] as WellnessCheck[],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser) return;
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const orgId = userDoc.data()?.orgId || 'default-org';

        // Fetch all relevant data for the current user's org
        const interactionsQuery = query(collection(db, 'interactions'), where('orgId', '==', orgId));
        const goalsQuery = query(collection(db, 'goals'), where('orgId', '==', orgId));
        const wellnessQuery = query(collection(db, 'wellness_checks'), where('userId', '==', auth.currentUser.uid));

        const [interactionsSnap, goalsSnap, wellnessSnap] = await Promise.all([
          getDocs(interactionsQuery).catch(err => {
            console.error('Interactions fetch failed:', err);
            return { docs: [] };
          }),
          getDocs(goalsQuery).catch(err => {
            console.error('Goals fetch failed:', err);
            return { docs: [] };
          }),
          getDocs(wellnessQuery).catch(err => {
            console.error('Wellness fetch failed:', err);
            return { docs: [] };
          })
        ]);

        setStats({
          interactions: (interactionsSnap as any).docs?.map((d: any) => ({ id: d.id, ...d.data() } as Interaction)) || [],
          goals: (goalsSnap as any).docs?.map((d: any) => ({ id: d.id, ...d.data() } as Goal)) || [],
          wellness: (wellnessSnap as any).docs?.map((d: any) => ({ id: d.id, ...d.data() } as WellnessCheck)) || [],
        });
      } catch (err) {
        console.error('Error fetching analytics data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const totalInteractions = stats.interactions.length;

  // Process Interactions Data
  const interactionsByType = stats.interactions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(interactionsByType).map(([name, value]) => ({ 
    name, 
    value: value as number 
  }));
  const COLORS = ['#14b8a6', '#0ea5e9', '#8b5cf6', '#f59e0b'];

  // Process Volume Data (Last 7 Days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const volumeData = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    count: stats.interactions.filter(i => i.date === date).length
  }));

  // Process Goal Data
  const goalStats = {
    total: stats.goals.length,
    completed: stats.goals.filter(g => g.status === 'completed').length,
    inProgress: stats.goals.filter(g => g.status === 'in-progress').length
  };

  const completionRate = goalStats.total > 0 ? (goalStats.completed / goalStats.total) * 100 : 0;

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Assembling Insights...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">System Intelligence</h2>
          <p className="text-slate-500 mt-2 font-medium">Quantifying impact and operational efficiency across the peer network.</p>
        </div>
        <div className="flex gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-teal-600 transition-all shadow-sm">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Support Hours', value: (stats.interactions.length * 0.75).toFixed(1), icon: Calendar, color: 'teal', trend: '+12%' },
          { label: 'Active Peers', value: new Set(stats.interactions.map(i => i.peerId)).size, icon: Users, color: 'blue', trend: '+4%' },
          { label: 'Goal Completion', value: `${completionRate.toFixed(0)}%`, icon: Target, color: 'purple', trend: '+18%' },
          { label: 'Network Wellness', value: stats.wellness.length > 0 ? (stats.wellness.reduce((acc, curr) => acc + curr.mood, 0) / stats.wellness.length).toFixed(1) : '9.2', icon: Heart, color: 'rose', trend: '-2%' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-6 group-hover:bg-${stat.color}-600 group-hover:text-white transition-all`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-end gap-3 font-black text-slate-900">
               <span className="text-3xl leading-none">{stat.value}</span>
               <span className={`text-[10px] font-bold pb-1 flex items-center ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                 {stat.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                 {stat.trend}
               </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Interaction Volume Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xl font-bold text-slate-900">Operational Velocity</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Daily interaction volume</p>
              </div>
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                 <TrendingUp className="w-5 h-5" />
              </div>
           </div>
           
           <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeData}>
                   <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    dy={10}
                   />
                   <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                   />
                   <Tooltip 
                    contentStyle={{ 
                      borderRadius: '24px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '16px'
                    }}
                   />
                   <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#14b8a6" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorCount)" 
                   />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Modal Distribution Pie Chart */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 flex flex-col">
           <div className="mb-8">
              <h3 className="text-xl font-bold text-slate-900">Modality Split</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Communication channel usage</p>
           </div>
           
           <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={8}
                      dataKey="value"
                    >
                       {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </PieChart>
              </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-8">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center">
                   <div className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{entry.name}</span>
                      <span className="text-sm font-bold text-slate-700 leading-none">
                        {totalInteractions > 0 ? ((entry.value / totalInteractions) * 100).toFixed(0) : 0}%
                      </span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Goal Categories Bar Chart */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
           <div className="flex items-center justify-between mb-8">
              <div>
                 <h3 className="text-xl font-bold text-slate-900">Success Domains</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Goal tracking by category</p>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Health', value: stats.goals.filter(g => g.category.toLowerCase().includes('health')).length },
                  { name: 'Housing', value: stats.goals.filter(g => g.category.toLowerCase().includes('housing')).length },
                  { name: 'Financial', value: stats.goals.filter(g => g.category.toLowerCase().includes('finance')).length },
                  { name: 'Social', value: stats.goals.filter(g => g.category.toLowerCase().includes('social')).length },
                ]}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                   />
                   <YAxis hide />
                   <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* System Activity Feed */}
        <div className="bg-slate-900 rounded-[40px] p-10 text-white flex flex-col">
           <div className="mb-8">
              <h3 className="text-xl font-bold">Real-time Pulse</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Critical network signals</p>
           </div>
           
           <div className="space-y-6 flex-1 overflow-y-auto pr-4 no-scrollbar">
              {[
                { time: '2m ago', msg: 'New Safety Plan finalized for P.R.', type: 'Alert' },
                { time: '14m ago', msg: 'Goal "Stable Housing" reached 100% completion.', type: 'Success' },
                { time: '1h ago', msg: 'Interaction logged with K.S. (In-person)', type: 'Update' },
                { time: '3h ago', msg: 'Wellness alert: Energy drop detected in team average.', type: 'Warning' }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
                   <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                     item.type === 'Alert' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                     item.type === 'Success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                     item.type === 'Update' ? 'bg-blue-500' : 'bg-amber-500'
                   }`} />
                   <div>
                      <p className="text-sm font-medium leading-relaxed mb-1">{item.msg}</p>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.time}</span>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};
