import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Wind, 
  Moon, 
  PenTool,
  Smile,
  AlertCircle,
  Loader2,
  TrendingUp,
  History,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { WellnessCheck } from '../types';
import { RechargePortal } from '../components/wellness/RechargePortal';

export const WellnessHub = () => {
  const navigate = useNavigate();
  const [activeRechargeType, setActiveRechargeType] = useState<'Box Breathing' | 'Grounding (5-4-3-2-1)' | 'Digital Detox' | null>(null);
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(4);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<WellnessCheck[]>([]);

  const fetchHistory = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'wellness_checks'),
        where('userId', '==', auth.currentUser.uid),
        orderBy('date', 'desc'),
        limit(14)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WellnessCheck));
      setHistory(data);
    } catch (err) {
      console.error('Error fetching wellness history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setIsSubmitting(true);
    try {
      const check: Omit<WellnessCheck, 'id'> = {
        userId: auth.currentUser.uid,
        date: new Date().toISOString(),
        mood,
        energy,
        stress,
        notes,
        burnoutRisk: stress > 7 ? 0.8 : stress > 4 ? 0.4 : 0.1,
        compassionFatigue: (stress + (10 - mood)) / 20
      };

      await addDoc(collection(db, 'wellness_checks'), check);
      setNotes('');
      alert('Check-in submitted. Remember to prioritize your peace today.');
      fetchHistory();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'wellness_checks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wellnessTips = [
    { title: 'Box Breathing', duration: '2 min', icon: Wind, desc: 'Calm your nervous system with equal ratio breathing.' },
    { title: 'Grounding (5-4-3-2-1)', duration: '5 min', icon: Brain, desc: 'Reconnect with your physical surroundings.' },
    { title: 'Digital Detox', duration: '15 min', icon: Moon, desc: 'Step away from screens and notifications.' }
  ];

  const chartData = history.map(item => ({
    name: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    mood: item.mood,
    energy: item.energy,
    stress: item.stress
  }));

  const avgEnergy = history.length > 0 
    ? history.slice(-3).reduce((acc, curr) => acc + curr.energy, 0) / Math.min(history.length, 3) 
    : 10;

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Wellness Hub</h2>
          <p className="text-slate-500 mt-2 font-medium">Monitoring the well-being of the peer specialist community.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl flex items-center shadow-sm">
             <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
             <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">System Stable</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Interface */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Trend Chart */}
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                   <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                      <TrendingUp className="w-6 h-6" />
                   </div>
                   <div>
                      <h3 className="text-xl font-bold text-slate-900">Well-being Trends</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 14 days insight</p>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="flex items-center">
                      <div className="w-2.5 h-2.5 bg-teal-500 rounded-full mr-2" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Mood</span>
                   </div>
                   <div className="flex items-center">
                      <div className="w-2.5 h-2.5 bg-amber-500 rounded-full mr-2" />
                      <span className="text-[10px] font-black text-slate-400 uppercase">Energy</span>
                   </div>
                </div>
             </div>

             <div className="h-[300px] w-full">
                {history.length < 2 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                     <History className="w-12 h-12 mb-2 opacity-20" />
                     <p className="font-bold text-sm">Awaiting more data points...</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis 
                        hide 
                        domain={[0, 10]} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '20px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          padding: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="mood" 
                        stroke="#14b8a6" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorMood)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="energy" 
                        stroke="#f59e0b" 
                        strokeWidth={4} 
                        fill="transparent" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
             </div>
          </div>

          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
             <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center">
               <Smile className="w-7 h-7 mr-4 text-teal-600" />
               Daily Check-in
             </h3>
             
             <form onSubmit={handleSubmit} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <div className="flex justify-between items-end">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Mood</label>
                         <span className="text-3xl">{['😔', '😐', '🙂', '😊', '🤩'][Math.floor(mood / 2.1)]}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="10" 
                        value={mood} 
                        onChange={(e) => setMood(parseInt(e.target.value))} 
                        className="w-full accent-teal-600 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" 
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                         <span>Down</span>
                         <span>Excellent</span>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div className="flex justify-between items-end">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Energy Level</label>
                         <span className="text-sm font-black bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full uppercase tracking-widest">{energy}/10</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="10" 
                        value={energy} 
                        onChange={(e) => setEnergy(parseInt(e.target.value))} 
                        className="w-full accent-amber-500 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" 
                      />
                      <div className="flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                         <span>Drained</span>
                         <span>Vibrant</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-end">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stress Intensity</label>
                      <span className="text-sm font-black bg-red-50 text-red-700 px-4 py-1.5 rounded-full uppercase tracking-widest">{stress}/10</span>
                   </div>
                   <input 
                    type="range" 
                    min="1" max="10" 
                    value={stress} 
                    onChange={(e) => setStress(parseInt(e.target.value))} 
                    className="w-full accent-red-500 h-2 bg-slate-100 rounded-full appearance-none cursor-pointer" 
                   />
                </div>
                
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center ml-1">
                     <PenTool className="w-3.5 h-3.5 mr-2" />
                     Professional Reflection
                   </label>
                   <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reflect on today's sessions, boundary wins, or self-care moments..." 
                    className="w-full min-h-[160px] px-8 py-6 bg-slate-50 border-none rounded-[32px] focus:ring-2 focus:ring-teal-500 text-slate-700 font-medium placeholder:text-slate-300 resize-none"
                   />
                </div>
                
                <button 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-teal-600 text-white rounded-[24px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Log Wellness Data'}
                </button>
             </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <AnimatePresence>
             {avgEnergy < 4 && (
               <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 rounded-[40px] p-10 border border-red-100 shadow-sm"
               >
                  <div className="flex items-center text-red-900 mb-6">
                     <AlertCircle className="w-6 h-6 mr-4" />
                     <h4 className="font-black uppercase tracking-widest text-xs">Sustainability Alert</h4>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed mb-8 font-bold">
                    Your average energy has dipped significantly this week. High risk of empathy fatigue detected.
                  </p>
                  <button 
                    onClick={() => navigate('/wellness/plan')}
                    className="w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                  >
                    Access Respite Plan
                  </button>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 px-2">Rapid Recharge</h4>
              <div className="space-y-6">
                 {wellnessTips.map((tip, i) => (
                    <motion.div 
                      key={i} 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveRechargeType(tip.title as any)}
                      className="p-5 bg-slate-50 rounded-[28px] border border-transparent hover:border-teal-100 transition-all cursor-pointer group"
                    >
                       <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm mr-4">
                            <tip.icon className="w-5 h-5" />
                          </div>
                          <div>
                             <h5 className="font-bold text-slate-900 text-sm">{tip.title}</h5>
                             <span className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">{tip.duration}</span>
                          </div>
                       </div>
                       <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{tip.desc}"</p>
                    </motion.div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 rounded-[40px] p-10 text-white">
              <div className="flex items-center mb-8">
                 <Calendar className="w-5 h-5 mr-3 text-teal-400" />
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Team Recharge Sync</h4>
              </div>
              <div className="space-y-6">
                 {[
                   { date: 'JUN 08', event: 'Supervision Session', type: 'Clinical' },
                   { date: 'JUN 12', event: 'Half-Day Rest', type: 'Wellness' },
                   { date: 'JUN 20', event: 'Team Debrief', type: 'Support' }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center group cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 flex flex-col items-center justify-center mr-5 group-hover:bg-teal-600 transition-colors">
                        <span className="text-[10px] font-black text-slate-500 group-hover:text-teal-200">{item.date.split(' ')[0]}</span>
                        <span className="text-lg font-black">{item.date.split(' ')[1]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold mb-0.5">{item.event}</p>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.type}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
      <AnimatePresence>
        {activeRechargeType && (
          <RechargePortal 
            type={activeRechargeType} 
            onClose={() => setActiveRechargeType(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

