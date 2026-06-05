import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Calendar, 
  User as UserIcon,
  ChevronRight,
  Loader2,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { Interaction, PeerProfile } from '../types';
import { useNavigate } from 'react-router-dom';

export const InteractionsList = () => {
  const navigate = useNavigate();
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [peers, setPeers] = useState<Record<string, PeerProfile>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInteractions = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'interactions'),
          where('specialistId', '==', auth.currentUser.uid),
          orderBy('date', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Interaction));
        setInteractions(data);

        // Fetch peer profiles for names
        const peerIds = Array.from(new Set(data.map(i => i.peerId)));
        const peerMap: Record<string, PeerProfile> = {};
        
        await Promise.all(peerIds.map(async (id) => {
          const peerDoc = await getDoc(doc(db, 'peers', id));
          if (peerDoc.exists()) {
            peerMap[id] = { id: peerDoc.id, ...peerDoc.data() } as PeerProfile;
          }
        }));
        setPeers(peerMap);

      } catch (err) {
        console.error('Error fetching interactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInteractions();
  }, []);

  const filteredInteractions = interactions.filter(i => {
    const peerName = peers[i.peerId]?.firstName || '';
    return (
      peerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Interactions History</h2>
          <p className="text-slate-500 mt-1">Review and manage your recovery-oriented support sessions.</p>
        </div>
        <button 
          onClick={() => navigate('/interactions/new')}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Log Interaction
        </button>
      </div>

      <div className="bg-white p-4 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by peer name or note content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Loading interaction history...</p>
        </div>
      ) : filteredInteractions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-center px-10">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
             <MessageSquare className="w-8 h-8 text-slate-300" />
           </div>
           <h3 className="text-xl font-bold text-slate-900 mb-2">No interactions recorded</h3>
           <p className="text-slate-500 max-w-sm mb-8">Start documenting your support journey by recording your first session.</p>
           <button 
             onClick={() => navigate('/interactions/new')}
             className="px-6 py-2 bg-teal-50 text-teal-600 font-bold rounded-xl hover:bg-teal-100 transition-colors"
           >
             Log Interaction
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredInteractions.map((interaction) => (
            <motion.div 
              key={interaction.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-[32px] border border-slate-200 hover:border-teal-200 transition-all group flex flex-col md:flex-row md:items-center gap-6 cursor-pointer"
            >
              <div className="flex-1 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                       <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                          <UserIcon className="w-6 h-6" />
                       </div>
                       <div>
                          <h4 className="font-bold text-slate-900 text-lg">
                            {peers[interaction.peerId]?.firstName} {peers[interaction.peerId]?.lastInitial}.
                          </h4>
                          <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">
                            {interaction.type.replace('-', ' ')} meeting
                          </span>
                       </div>
                    </div>
                    <div className="flex items-center text-slate-400 text-sm font-medium">
                       <Calendar className="w-4 h-4 mr-2" />
                       {new Date(interaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                 </div>
                 
                 <div className="flex items-start bg-slate-50 p-4 rounded-2xl">
                    <FileText className="w-4 h-4 text-slate-400 mr-3 mt-1 shrink-0" />
                    <p className="text-slate-600 text-sm line-clamp-2 leading-relaxed">
                      {interaction.aiSummary || interaction.notes}
                    </p>
                 </div>

                 {interaction.goalsDiscussed.length > 0 && (
                   <div className="flex flex-wrap gap-2">
                      {interaction.goalsDiscussed.map((goal, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-slate-100 text-[10px] font-bold text-slate-500 rounded-lg uppercase tracking-wider">
                          {goal}
                        </span>
                      ))}
                   </div>
                 )}
              </div>
              <div className="flex items-center md:items-end justify-between md:justify-center md:pl-6 md:border-l border-slate-100">
                 <button className="md:w-10 md:h-10 w-full py-3 md:py-0 bg-slate-50 group-hover:bg-teal-600 text-slate-400 group-hover:text-white rounded-xl flex items-center justify-center transition-all">
                    <ChevronRight className="w-5 h-5" />
                 </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
