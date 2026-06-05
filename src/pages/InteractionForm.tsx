import { useState, useEffect } from 'react';
import { 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Zap,
  ShieldCheck,
  Save,
  ChevronLeft,
  Loader2,
  Calendar,
  MapPin,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { checkAILanguage, getAIDocumentation } from '../lib/ai';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { PeerProfile, Interaction } from '../types';
import { useNavigate } from 'react-router-dom';

export const InteractionForm = () => {
  const navigate = useNavigate();
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [peerId, setPeerId] = useState('');
  const [meetingType, setMeetingType] = useState<'in-person' | 'phone' | 'virtual' | 'text'>('in-person');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [discussionTopics, setDiscussionTopics] = useState('');
  const [goalsDiscussed, setGoalsDiscussed] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [boundariesChecked, setBoundariesChecked] = useState({
    noClinical: false,
    livedExpIdx: false,
    peerDefinedGoals: false,
    privacyConfirmed: false
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [summary, setSummary] = useState('');

  useEffect(() => {
    const fetchPeers = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        const orgId = userData?.orgId || 'default-org';

        const q = query(
          collection(db, 'peers'), 
          where('orgId', '==', orgId),
          where('specialistId', '==', auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerProfile));
        setPeers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPeers(false);
      }
    };
    fetchPeers();
  }, []);

  const handleLanguageCheck = async () => {
    if (!notes) return;
    setIsProcessing(true);
    setAiAnalysis(null);
    try {
      const result = await checkAILanguage(notes);
      setAiAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummaryGenerate = async () => {
    if (!notes) return;
    setIsProcessing(true);
    setSummary('');
    try {
      const result = await getAIDocumentation(notes);
      setSummary(result.text);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser || !peerId || !notes) {
      alert('Please select a peer and enter notes.');
      return;
    }

    setIsSaving(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      const orgId = userData?.orgId || 'default-org';

      const interaction: Omit<Interaction, 'id'> = {
        peerId,
        specialistId: auth.currentUser.uid,
        orgId,
        date: new Date().toISOString(),
        type: meetingType,
        location,
        notes,
        aiSummary: summary || undefined,
        discussionTopics: discussionTopics.split(',').map(t => t.trim()).filter(t => t),
        goalsDiscussed: goalsDiscussed.split(',').map(g => g.trim()).filter(g => g),
        strengthsIdentified: aiAnalysis?.strengths || [],
        actionItems: [], // Can be expanded later
        followUpDate
      };

      await addDoc(collection(db, 'interactions'), interaction);
      navigate('/interactions'); // Ideally this goes back to the list
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'interactions');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div 
        onClick={() => navigate('/interactions')}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group w-fit"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold text-sm">Back to Interactions</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">New Interaction Log</h2>
          <p className="text-slate-500 mt-1">Document your support session with trauma-informed precision.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || !peerId || !notes}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          Save Meeting Note
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-12 space-y-8">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden text-slate-800">
             <div className="p-8 space-y-8">
                {/* Peer Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800">
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Peer</label>
                      <select 
                        disabled={loadingPeers}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium appearance-none disabled:opacity-50"
                        value={peerId}
                        onChange={(e) => setPeerId(e.target.value)}
                      >
                        <option value="">{loadingPeers ? 'Loading peers...' : 'Choose a peer...'}</option>
                        {peers.map(peer => (
                          <option key={peer.id} value={peer.id}>{peer.firstName} {peer.lastInitial}.</option>
                        ))}
                      </select>
                   </div>
                   <div className="space-y-1.5 text-slate-800">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Meeting Type</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-800 font-medium appearance-none"
                        value={meetingType}
                        onChange={(e) => setMeetingType(e.target.value as any)}
                      >
                        <option value="in-person">In-Person</option>
                        <option value="virtual">Virtual Meeting</option>
                        <option value="phone">Phone Call</option>
                        <option value="text">Text Support</option>
                      </select>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800">
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Location / Details</label>
                      <input 
                        type="text" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Community Center, Room 4"
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-800"
                      />
                   </div>
                   <div className="space-y-1.5 font-medium">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Discussion Topics</label>
                      <input 
                        type="text" 
                        value={discussionTopics}
                        onChange={(e) => setDiscussionTopics(e.target.value)}
                        placeholder="comma separated"
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-800"
                      />
                   </div>
                </div>

                {/* notes */}
                <div className="space-y-1.5">
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Session Notes (Rough Draft)
                      </label>
                      <div className="flex space-x-2">
                        <button 
                          onClick={handleLanguageCheck}
                          disabled={isProcessing || !notes}
                          className="px-3 py-1.5 bg-teal-50 text-teal-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-teal-100 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Check Language
                        </button>
                        <button 
                           onClick={handleSummaryGenerate}
                           disabled={isProcessing || !notes}
                           className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Summary
                        </button>
                      </div>
                   </div>
                   <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter your notes here. Use the AI tools above to refine your language and generate summaries..." 
                    className="w-full min-h-[240px] px-6 py-6 bg-slate-50 border-none rounded-[24px] focus:ring-2 focus:ring-teal-500 text-slate-700 leading-relaxed resize-none"
                   />
                </div>
             </div>

             {/* AI Output Area */}
             <AnimatePresence>
                {(aiAnalysis || summary || isProcessing) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-slate-50 border-t border-slate-100 p-8"
                  >
                    {isProcessing ? (
                       <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mr-3" />
                          <p className="font-bold text-slate-600 animate-pulse">Gemini is processing your request...</p>
                       </div>
                    ) : (
                      <div className="space-y-8">
                         {aiAnalysis && (
                           <div className="space-y-4">
                              <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider">
                                <ShieldCheck className="w-4 h-4 mr-2 text-emerald-500" />
                                Language Analysis
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {aiAnalysis.flags?.map((flag: any, i: number) => (
                                   <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                                      <p className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full w-fit mb-2 uppercase tracking-widest italic flex items-center">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Potential Flag
                                      </p>
                                      <p className="text-xs text-slate-400 mb-1">Found: <span className="text-slate-800 font-medium italic">"{flag.original}"</span></p>
                                      <p className="text-xs text-slate-800 mb-2 font-medium">{flag.reason}</p>
                                      <div className="pt-2 border-t border-slate-50">
                                         <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">Recommendation</p>
                                         <p className="text-xs text-teal-700 font-medium">"{flag.suggestion}"</p>
                                      </div>
                                   </div>
                                 ))}
                                 {aiAnalysis.flags?.length === 0 && (
                                   <div className="col-span-2 py-8 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center">
                                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
                                      <p className="text-emerald-800 font-bold">Great work! Your documentation is highly recovery-oriented.</p>
                                   </div>
                                 )}
                              </div>
                           </div>
                         )}

                         {summary && (
                            <div className="space-y-4">
                               <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider">
                                 <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" />
                                 Generated Professional Summary
                               </h4>
                               <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium border-l-4 border-l-indigo-500">
                                 {summary}
                               </div>
                               <button 
                                onClick={() => { setNotes(summary); setSummary(''); }}
                                className="text-xs font-bold text-indigo-600 hover:underline flex items-center"
                               >
                                 <Zap className="w-3 h-3 mr-1" />
                                 Update notes with this summary
                               </button>
                            </div>
                         )}
                      </div>
                    )}
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-white rounded-[32px] p-8 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Goals & Progress</h4>
                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discussed Goals</label>
                      <input 
                        type="text" 
                        value={goalsDiscussed}
                        onChange={(e) => setGoalsDiscussed(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-800" 
                        placeholder="e.g. Housing search, Application sent" 
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Follow-up Date</label>
                      <input 
                        type="date" 
                        value={followUpDate}
                        onChange={(e) => setFollowUpDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-sm font-medium text-slate-800" 
                      />
                   </div>
                </div>
             </div>
             
             <div className="bg-white rounded-[32px] p-8 border border-slate-200">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Boundaries check</h4>
                <div className="space-y-3">
                   {[
                     "I avoided making any clinical recommendations.",
                     "I focused on lived experience shared-learning.",
                     "The peer defined their own recovery goals.",
                     "Privacy and consent were confirmed."
                   ].map((text, i) => (
                     <label key={i} className="flex items-center p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors group">
                        <input 
                          type="checkbox" 
                          checked={(boundariesChecked as any)[['noClinical', 'livedExpIdx', 'peerDefinedGoals', 'privacyConfirmed'][i]]}
                          onChange={(e) => setBoundariesChecked({...boundariesChecked, [['noClinical', 'livedExpIdx', 'peerDefinedGoals', 'privacyConfirmed'][i]]: e.target.checked})}
                          className="w-4 h-4 text-teal-600 rounded border-slate-300 mr-3 focus:ring-teal-500" 
                        />
                        <span className="text-xs text-slate-700 font-medium group-hover:text-slate-900">{text}</span>
                     </label>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
