import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../lib/firebase';
import { PeerProfile } from '../types';
import { PeerCard } from '../components/peers/PeerCard';
import { Plus, Search, Filter, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PeersList = () => {
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastInitial: '',
    pronouns: '',
    supportGoals: '',
    strengths: '',
    interests: ''
  });

  const fetchPeers = async () => {
    if (!auth.currentUser) return;
    
    setLoading(true);
    const path = 'peers';
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      const orgId = userData?.orgId || 'default-org';

      const q = query(
        collection(db, path), 
        where('orgId', '==', orgId),
        where('specialistId', '==', auth.currentUser.uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerProfile));
      setPeers(data);
    } catch (err) {
      console.error('Error fetching peers:', err);
      // Fallback to dummies if it fails or return empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeers();
  }, []);

  const handleCreatePeer = async (e: any) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    setCreating(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      const orgId = userData?.orgId || 'default-org';

      const newPeer: Omit<PeerProfile, 'id'> = {
        firstName: formData.firstName,
        lastInitial: formData.lastInitial.toUpperCase().slice(0, 1),
        pronouns: formData.pronouns,
        orgId,
        specialistId: auth.currentUser.uid,
        supportGoals: formData.supportGoals.split(',').map(s => s.trim()).filter(s => s),
        strengths: formData.strengths.split(',').map(s => s.trim()).filter(s => s),
        interests: formData.interests.split(',').map(s => s.trim()).filter(s => s),
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'peers'), newPeer);
      setShowAddModal(false);
      setFormData({ firstName: '', lastInitial: '', pronouns: '', supportGoals: '', strengths: '', interests: '' });
      fetchPeers();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'peers');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePeer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this peer profile?')) return;
    
    try {
      await deleteDoc(doc(db, 'peers', id));
      fetchPeers();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `peers/${id}`);
    }
  };

  const displayedPeers = peers;
  const filteredPeers = displayedPeers.filter(p => 
    p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.supportGoals.some(g => g.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Peer Directory</h2>
          <p className="text-slate-500 mt-1">Manage and support your peer community.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Peer
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, goal, or interest..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
          />
        </div>
        <button className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 flex items-center hover:bg-slate-50 font-medium">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading your peers...</p>
        </div>
      ) : filteredPeers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center px-10">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
             <Search className="w-8 h-8 text-slate-300" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No peers found</h3>
           <p className="text-slate-500 max-w-sm mb-8">Try adjusting your search or add a new peer to your community directory.</p>
           <button 
             onClick={() => setShowAddModal(true)}
             className="px-6 py-2 bg-teal-50 text-teal-600 font-bold rounded-xl hover:bg-teal-100 transition-colors"
           >
             Add First Peer
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPeers.map(peer => (
            <div key={peer.id} className="relative group/card">
              <PeerCard peer={peer} />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePeer(peer.id);
                }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm text-slate-400 hover:text-red-500 rounded-lg shadow-sm flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
               className="relative bg-white rounded-[32px] shadow-2xl p-8 max-w-xl w-full"
             >
                <form onSubmit={handleCreatePeer}>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">New Peer Profile</h3>
                  <p className="text-slate-500 mb-8">Establish a new support relationship connection.</p>
                  
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">First Name</label>
                          <input 
                            required
                            type="text" 
                            value={formData.firstName}
                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                            placeholder="e.g. Sarah" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Last Initial</label>
                          <input 
                            required
                            type="text" 
                            value={formData.lastInitial}
                            onChange={e => setFormData({...formData, lastInitial: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                            placeholder="e.g. M" 
                            maxLength={1} 
                          />
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Pronouns</label>
                          <input 
                            type="text" 
                            value={formData.pronouns}
                            onChange={e => setFormData({...formData, pronouns: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                            placeholder="e.g. she/her" 
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Strengths</label>
                          <input 
                            type="text" 
                            value={formData.strengths}
                            onChange={e => setFormData({...formData, strengths: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                            placeholder="comma separated" 
                          />
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Support Goals</label>
                        <input 
                          type="text" 
                          value={formData.supportGoals}
                          onChange={e => setFormData({...formData, supportGoals: e.target.value})}
                          className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500" 
                          placeholder="e.g. Housing, Job Search (comma separated)" 
                        />
                     </div>
                  </div>

                  <div className="flex gap-3 mt-10">
                     <button 
                      type="button"
                      disabled={creating}
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-3 border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-colors disabled:opacity-50"
                     >
                       Cancel
                     </button>
                     <button 
                      type="submit"
                      disabled={creating}
                      className="flex-1 py-3 bg-teal-600 text-white rounded-2xl font-bold shadow-lg shadow-teal-100 hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                     >
                       {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Profile'}
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
