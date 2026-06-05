import { useState, useEffect } from 'react';
import { 
  Target, 
  CheckCircle2, 
  Circle, 
  Plus, 
  ChevronRight, 
  Flame,
  Award,
  Loader2,
  Trash2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Goal, PeerProfile } from '../types';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc
} from 'firebase/firestore';

export const GoalsTracker = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    peerId: '',
    title: '',
    category: 'Housing',
    milestones: ['']
  });

  const categories = [
    'Housing', 'Employment', 'Education', 'Wellness', 'Legal', 'Financial', 'Social'
  ];

  const fetchGoals = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      const orgId = userData?.orgId || 'default-org';

      const q = query(collection(db, 'goals'), where('orgId', '==', orgId));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
      setGoals(data);

      const pq = query(
        collection(db, 'peers'), 
        where('orgId', '==', orgId),
        where('specialistId', '==', auth.currentUser.uid)
      );
      const psnap = await getDocs(pq);
      setPeers(psnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerProfile)));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.peerId || !formData.title) return;

    setCreating(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      const orgId = userData?.orgId || 'default-org';

      const newGoal: Omit<Goal, 'id'> = {
        peerId: formData.peerId,
        orgId,
        title: formData.title,
        category: formData.category,
        status: 'not-started',
        progress: 0,
        createdAt: new Date().toISOString(),
        milestones: formData.milestones
          .filter(m => m.trim())
          .map((m, i) => ({ id: `m-${Date.now()}-${i}`, title: m, completed: false }))
      };

      await addDoc(collection(db, 'goals'), newGoal);
      setShowAddModal(false);
      setFormData({ peerId: '', title: '', category: 'Housing', milestones: [''] });
      fetchGoals();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'goals');
    } finally {
      setCreating(false);
    }
  };

  const toggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newMilestones = goal.milestones.map(m => 
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    const completedCount = newMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / newMilestones.length) * 100);
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'not-started';

    try {
      await updateDoc(doc(db, 'goals', goalId), {
        milestones: newMilestones,
        progress,
        status
      });
      fetchGoals();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `goals/${goalId}`);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await deleteDoc(doc(db, 'goals', id));
      fetchGoals();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `goals/${id}`);
    }
  };

  const getPeerName = (id: string) => {
    const peer = peers.find(p => p.id === id);
    return peer ? `${peer.firstName} ${peer.lastInitial}.` : 'Loading...';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Support Goal Tracking</h2>
          <p className="text-slate-500 mt-1">Measuring milestones and celebrating peer-led achievements.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Peer Goal
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center px-10">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
             <Target className="w-8 h-8" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No active goals</h3>
           <p className="text-slate-500 max-w-sm mb-8">Set peer-defined objectives to track progress together.</p>
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-6 py-2 bg-teal-50 text-teal-600 font-bold rounded-xl hover:bg-teal-100 transition-colors"
           >
             Set First Goal
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {goals.map((goal) => (
            <motion.div 
              key={goal.id}
              whileHover={{ y: -4 }}
              className={`bg-white rounded-[32px] border p-8 shadow-sm transition-all group overflow-hidden relative ${
                goal.status === 'completed' ? 'border-emerald-100 shadow-emerald-50/50' : 'border-slate-200'
              }`}
            >
              {goal.status === 'completed' && (
                 <div className="absolute top-0 right-0 p-4">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-full">
                       <Award className="w-6 h-6" />
                    </div>
                 </div>
              )}

              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${goal.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-teal-50 text-teal-600'}`}>
                      <Target className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-0.5">{goal.category}</h4>
                      <p className="text-lg font-bold text-slate-900 leading-tight">{goal.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Peer: {getPeerName(goal.peerId)}</p>
                    </div>
                 </div>
                 <button 
                    onClick={() => deleteGoal(goal.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
              </div>

              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-xs font-black mb-2 uppercase tracking-widest text-slate-400">
                       <span>Progress</span>
                       <span className={`${goal.status === 'completed' ? 'text-emerald-600' : 'text-teal-600'}`}>{goal.progress}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        className={`h-full rounded-full transition-all duration-1000 ${
                          goal.status === 'completed' ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-3">Milestones</h5>
                    {goal.milestones.map((milestone) => (
                      <div 
                        key={milestone.id} 
                        onClick={() => toggleMilestone(goal.id, milestone.id)}
                        className="flex items-center p-3.5 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group/item border border-transparent hover:border-slate-100"
                      >
                         {milestone.completed ? (
                           <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                         ) : (
                           <Circle className="w-5 h-5 text-slate-200 mr-3 shrink-0 group-hover/item:text-teal-300 transition-colors" />
                         )}
                         <span className={`text-sm font-bold ${milestone.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>
                           {milestone.title}
                         </span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between text-slate-800">
                 <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Flame className="w-3 h-3 mr-1.5 text-amber-500" />
                    Started: {new Date(goal.createdAt).toLocaleDateString()}
                 </div>
                 <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                    {goal.status.replace('-', ' ')}
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => !creating && setShowAddModal(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
             />
             <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="relative bg-white rounded-[40px] shadow-2xl p-10 max-w-xl w-full flex flex-col max-h-[90vh] overflow-hidden"
             >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">New Support Goal</h3>
                    <p className="text-slate-500 font-medium">Define clear, peer-led outcomes.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateGoal} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Peer</label>
                      <select 
                        required
                        value={formData.peerId}
                        onChange={(e) => setFormData({...formData, peerId: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold appearance-none"
                      >
                        <option value="">Select a peer...</option>
                        {peers.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastInitial}.</option>
                        ))}
                      </select>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Goal Title</label>
                      <input 
                        required
                        type="text" 
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Sustainable housing"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                      />
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold appearance-none"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Milestones
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, milestones: [...formData.milestones, '']})}
                          className="text-teal-600 hover:underline"
                        >
                          + Add Step
                        </button>
                      </label>
                      <div className="space-y-2">
                        {formData.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input 
                              type="text" 
                              value={milestone}
                              onChange={(e) => {
                                const newM = [...formData.milestones];
                                newM[idx] = e.target.value;
                                setFormData({...formData, milestones: newM});
                              }}
                              placeholder={`Step ${idx + 1}`}
                              className="flex-1 px-5 py-3 bg-slate-50 border-none rounded-[16px] focus:ring-2 focus:ring-teal-500 text-slate-700 font-bold text-sm"
                            />
                            {formData.milestones.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => {
                                  const newM = formData.milestones.filter((_, i) => i !== idx);
                                  setFormData({...formData, milestones: newM});
                                }}
                                className="p-2 text-slate-300 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        disabled={creating}
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-4 border border-slate-200 rounded-[20px] text-slate-600 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={creating}
                        className="flex-1 py-4 bg-teal-600 text-white rounded-[20px] font-bold shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Activate Goal'}
                      </button>
                   </div>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
