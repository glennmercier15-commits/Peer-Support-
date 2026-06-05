import { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Target, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
  Heart
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { WellnessCheck } from '../types';
import { StatsCard } from '../components/common/StatsCard';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [wellness, setWellness] = useState<WellnessCheck | null>(null);

  useEffect(() => {
    const fetchWellness = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'wellness_checks'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('date', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setWellness(snap.docs[0].data() as WellnessCheck);
        }
      } catch (err) {
        console.error('Error fetching dashboard wellness:', err);
      }
    };
    fetchWellness();

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const upcomingMeetings = [
    { name: 'Sarah M.', time: '10:30 AM', type: 'Virtual', goal: 'Housing' },
    { name: 'James K.', time: '1:00 PM', type: 'In-person', goal: 'Employment' },
    { name: 'Elena R.', time: '3:45 PM', type: 'Phone', goal: 'Wellness' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Support Dashboard</h2>
          <p className="text-slate-500 mt-1">Lived experience meeting professional practice.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Tasks & Meetings */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/interactions/new')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-teal-300 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-2 group-hover:bg-teal-600 group-hover:text-white transition-colors text-lg font-bold">
                +
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Interaction</span>
            </button>
            <button 
              onClick={() => navigate('/safety')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-orange-200 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 bg-orange-50 text-base rounded-full flex items-center justify-center mb-2">
                🛡️
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Safety Plan</span>
            </button>
            <button 
              onClick={() => navigate('/assistant')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-blue-200 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 bg-blue-50 text-base rounded-full flex items-center justify-center mb-2">
                💬
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">AI Coach</span>
            </button>
            <button 
              onClick={() => navigate('/resources')}
              className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-[24px] shadow-sm hover:border-purple-200 transition-all hover:shadow-md group"
            >
              <div className="w-10 h-10 bg-purple-50 text-base rounded-full flex items-center justify-center mb-2">
                📚
              </div>
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Resources</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/chat')}
              className="px-6 py-6 bg-teal-900 rounded-[32px] text-white shadow-xl shadow-teal-900/10 hover:bg-teal-800 transition-all flex items-center justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400 opacity-5 blur-2xl rounded-full group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-teal-800 rounded-2xl flex items-center justify-center text-teal-300">
                   <MessageSquare className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h4 className="text-lg font-bold tracking-tight">Peer Support Network</h4>
                  <p className="text-teal-400 text-xs font-medium mt-0.5">Real-time collaboration with specialists</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white group-hover:translate-x-1 transition-transform relative z-10">
                <ArrowRight size={20} />
              </div>
            </button>
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 flex items-center justify-between shadow-sm">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Performance Pulse</h4>
                    <p className="text-xs text-slate-500 font-medium">View your impact analytics</p>
                  </div>
               </div>
               <button 
                onClick={() => navigate('/analytics')}
                className="px-4 py-2 bg-slate-50 text-slate-600 font-bold text-[10px] rounded-xl hover:bg-slate-100 uppercase tracking-widest"
               >
                 View Reports
               </button>
            </div>
          </div>

          {/* Today's Schedule Redesign */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col flex-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-900">Today's Connection Circles</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {new Date().toLocaleDateString('en-CA', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            <div className="space-y-4">
              {[
                { time: '09:30', name: 'Marcus R.', location: 'Community Hub', focus: 'Housing stability & goal review', type: 'in-person' },
                { time: '11:00', name: 'Elena W.', location: 'Virtual Call', focus: '3-month sobriety celebration', type: 'follow-up' },
                { time: '14:00', name: 'Supervision Session', location: 'Team Office', focus: 'Review monthly caseload metrics', type: 'admin' }
              ].map((meeting, i) => (
                <div key={i} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${
                  meeting.type === 'in-person' ? 'bg-teal-50/50 border-teal-100 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'
                }`}>
                  <div className={`w-14 h-14 rounded-xl shadow-sm flex items-center justify-center text-sm font-bold ${
                    meeting.type === 'in-person' ? 'bg-white text-teal-700' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {meeting.time}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center">
                      {meeting.name}
                      <span className="text-[10px] font-medium text-slate-400 ml-2 uppercase tracking-wide">@ {meeting.location}</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 italic leading-relaxed">"{meeting.focus}"</p>
                  </div>
                  {meeting.type === 'follow-up' && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      Follow Up
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-slate-800">
               <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock className="w-3 h-3 mr-2 text-teal-500" />
                  Practice Note: Language matters. Focus on strengths today.
               </div>
               <button className="text-xs font-bold text-teal-600 hover:underline flex items-center">
                 Weekly Planner <ChevronRight className="w-4 h-4 ml-1" />
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant & Wellness */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 text-slate-800">
          {/* AI Assistant Redesign */}
          <div className="bg-slate-900 text-white rounded-[32px] p-8 shadow-xl flex flex-col min-h-[400px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-400 to-teal-400 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                ✦
              </div>
              <h3 className="text-lg font-bold tracking-tight">Gemini AI Peer Coach</h3>
            </div>
            
            <div className="flex-1 space-y-6">
              <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prep Prompt:</p>
                <p className="text-sm text-slate-200 italic leading-relaxed">
                  "I'm meeting someone struggling with housing insecurity. How can I start a trauma-informed conversation?"
                </p>
              </div>
              
              <div className="border-l-4 border-teal-500 pl-5 py-1">
                <p className="text-xs font-bold text-teal-400 mb-3 uppercase tracking-widest">Strengths-Focused Suggestions:</p>
                <ul className="text-sm space-y-3 text-slate-300">
                  <li className="flex gap-3 leading-relaxed">
                    <span className="text-teal-500">•</span>
                    "What keeps you grounded during these uncertain times?"
                  </li>
                  <li className="flex gap-3 leading-relaxed">
                    <span className="text-teal-500">•</span>
                    "What has helped you feel safer in the past?"
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 relative">
              <input 
                type="text" 
                placeholder="Ask for reflection advice..." 
                className="w-full bg-slate-800 border-none rounded-2xl py-4 pl-5 pr-14 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-teal-500 transition-all font-medium" 
              />
              <button className="absolute right-2 top-2 w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center hover:bg-teal-700 transition-colors shadow-lg shadow-teal-900/50">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Wellness Redesign */}
          <div className="bg-teal-600 text-white rounded-[32px] p-8 shadow-lg flex flex-col group relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6 text-white">
                <h3 className="text-lg font-bold">My Self-Care Hub</h3>
                <span className="text-[10px] font-black px-2.5 py-1 bg-teal-500 rounded-full border border-teal-400 uppercase tracking-widest">
                  Secure
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                  <span className="block text-[10px] text-teal-100 font-bold uppercase tracking-widest mb-1">Mood</span>
                  <span className="text-2xl font-display font-bold">{wellness ? (wellness.mood * 10).toFixed(0) : '85'}%</span>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                  <span className="block text-[10px] text-teal-100 font-bold uppercase tracking-widest mb-1">Energy</span>
                  <span className="text-xl font-display font-bold">{wellness ? (wellness.energy * 10).toFixed(0) : '75'}%</span>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/wellness')}
                className="w-full py-4 bg-white text-teal-700 font-bold text-sm rounded-2xl hover:bg-teal-50 transition-all shadow-xl shadow-teal-900/10 flex items-center justify-center"
              >
                Log Daily Check-in <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
