import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  LifeBuoy, 
  MapPin, 
  Phone, 
  Heart,
  Save,
  Plus,
  Trash2,
  ExternalLink,
  ChevronLeft,
  Loader2,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { PeerProfile, SafetyPlan } from '../types';
import { useNavigate } from 'react-router-dom';

export const SafetyPlanBuilder = () => {
  const navigate = useNavigate();
  const [peers, setPeers] = useState<PeerProfile[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(true);
  const [peerId, setPeerId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  const [warningSigns, setWarningSigns] = useState(['']);
  const [copingStrategies, setCopingStrategies] = useState(['']);
  const [supportPeople, setSupportPeople] = useState(['']);
  const [safePlaces, setSafePlaces] = useState(['']);
  const [helpfulActivities, setHelpfulActivities] = useState(['']);

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
        setPeers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PeerProfile)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPeers(false);
      }
    };
    fetchPeers();
  }, []);

  useEffect(() => {
    const fetchExistingPlan = async () => {
      if (!peerId) {
        setPlanId(null);
        setWarningSigns(['']);
        setCopingStrategies(['']);
        setSupportPeople(['']);
        setSafePlaces(['']);
        setHelpfulActivities(['']);
        return;
      }

      try {
        const q = query(collection(db, 'safety_plans'), where('peerId', '==', peerId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data() as SafetyPlan;
          setPlanId(snap.docs[0].id);
          setWarningSigns(data.warningSigns || ['']);
          setCopingStrategies(data.copingStrategies || ['']);
          setSupportPeople(data.supportPeople || ['']);
          setSafePlaces(data.safePlaces || ['']);
          setHelpfulActivities(data.helpfulActivities || ['']);
        } else {
          setPlanId(null);
          setWarningSigns(['']);
          setCopingStrategies(['']);
          setSupportPeople(['']);
          setSafePlaces(['']);
          setHelpfulActivities(['']);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchExistingPlan();
  }, [peerId]);

  const handleSave = async () => {
    if (!auth.currentUser || !peerId) {
      alert('Please select a peer first.');
      return;
    }

    setIsSaving(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const orgId = userDoc.data()?.orgId || 'default-org';

      const planData: Omit<SafetyPlan, 'id'> = {
        peerId,
        orgId,
        warningSigns: warningSigns.filter(s => s.trim()),
        copingStrategies: copingStrategies.filter(s => s.trim()),
        supportPeople: supportPeople.filter(s => s.trim()),
        safePlaces: safePlaces.filter(s => s.trim()),
        helpfulActivities: helpfulActivities.filter(s => s.trim()),
        emergencyContacts: ['988', '911'],
        updatedAt: new Date().toISOString()
      };

      if (planId) {
        await updateDoc(doc(db, 'safety_plans', planId), planData);
      } else {
        await addDoc(collection(db, 'safety_plans'), planData);
      }
      
      alert('Safety plan saved successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'safety_plans');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (list: string[], setter: (v: string[]) => void) => {
    setter([...list, '']);
  };

  const updateItem = (list: string[], setter: (v: string[]) => void, index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };

  const removeItem = (list: string[], setter: (v: string[]) => void, index: number) => {
    const newList = list.filter((_, i) => i !== index);
    setter(newList.length === 0 ? [''] : newList);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div 
        onClick={() => navigate('/')}
        className="flex items-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group w-fit"
      >
        <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
        <span className="font-semibold text-sm">Back to Dashboard</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Collaborative Safety Plan</h2>
          <p className="text-slate-500 mt-1">Strengthening support and preparedness through partnership.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving || !peerId}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {planId ? 'Update Safety Plan' : 'Save Safety Plan'}
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
        <div className="flex items-center space-x-4 mb-2">
           <Users className="w-5 h-5 text-teal-600" />
           <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Peer for Safety Planning</label>
        </div>
        <select 
          value={peerId}
          onChange={(e) => setPeerId(e.target.value)}
          disabled={loadingPeers}
          className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-900 font-bold appearance-none disabled:opacity-50"
        >
          <option value="">{loadingPeers ? 'Loading peers...' : 'Choose a peer...'}</option>
          {peers.map(p => (
            <option key={p.id} value={p.id}>{p.firstName} {p.lastInitial}.</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Warning Signs */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                 <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mr-4">
                    <AlertTriangle className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">1. Warning Signs</h3>
              </div>
              <button 
                onClick={() => addItem(warningSigns, setWarningSigns)}
                className="p-2 hover:bg-slate-50 rounded-lg text-teal-600"
              >
                <Plus className="w-5 h-5" />
              </button>
           </div>
           <p className="text-sm text-slate-500 mb-4 italic">"What do I notice when I'm starting to struggle?"</p>
           <div className="space-y-3">
              {warningSigns.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={val} 
                    onChange={(e) => updateItem(warningSigns, setWarningSigns, i, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-medium"
                    placeholder="e.g. Avoiding phone calls..."
                  />
                  <button onClick={() => removeItem(warningSigns, setWarningSigns, i)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
           </div>
        </div>

        {/* Coping Strategies */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                 <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mr-4">
                    <Heart className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">2. Coping Strategies</h3>
              </div>
              <button 
                onClick={() => addItem(copingStrategies, setCopingStrategies)}
                className="p-2 hover:bg-slate-50 rounded-lg text-teal-600"
              >
                <Plus className="w-5 h-5" />
              </button>
           </div>
           <p className="text-sm text-slate-500 mb-4 italic">"What can I do to help myself without reaching out to others?"</p>
           <div className="space-y-3 text-slate-800">
              {copingStrategies.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={val} 
                    onChange={(e) => updateItem(copingStrategies, setCopingStrategies, i, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-medium"
                    placeholder="e.g. Deep breathing exercises..."
                  />
                  <button onClick={() => removeItem(copingStrategies, setCopingStrategies, i)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
           </div>
        </div>

        {/* Support People */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                 <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mr-4">
                    <LifeBuoy className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">3. Support People</h3>
              </div>
              <button 
                onClick={() => addItem(supportPeople, setSupportPeople)}
                className="p-2 hover:bg-slate-50 rounded-lg text-teal-600"
              >
                <Plus className="w-5 h-5" />
              </button>
           </div>
           <p className="text-sm text-slate-500 mb-4 italic">"Who can I contact that provides support or distraction?"</p>
           <div className="space-y-3 text-slate-800">
              {supportPeople.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={val} 
                    onChange={(e) => updateItem(supportPeople, setSupportPeople, i, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-800 text-sm font-medium"
                    placeholder="e.g. Aunt Maria, 555-0199"
                  />
                  <button onClick={() => removeItem(supportPeople, setSupportPeople, i)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
           </div>
        </div>

        {/* Safe Places */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                 <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mr-4">
                    <MapPin className="w-5 h-5" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-900">4. Safe Places</h3>
              </div>
              <button 
                onClick={() => addItem(safePlaces, setSafePlaces)}
                className="p-2 hover:bg-slate-50 rounded-lg text-teal-600"
              >
                <Plus className="w-5 h-5" />
              </button>
           </div>
           <p className="text-sm text-slate-500 mb-4 italic">"Where can I go that feels safe or comforting?"</p>
           <div className="space-y-3 text-slate-800">
              {safePlaces.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    type="text" 
                    value={val} 
                    onChange={(e) => updateItem(safePlaces, setSafePlaces, i, e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500 text-slate-800 text-sm font-medium"
                    placeholder="e.g. Public Library, Highland Park..."
                  />
                  <button onClick={() => removeItem(safePlaces, setSafePlaces, i)} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
           </div>
        </div>

        {/* Emergency Resources */}
        <div className="bg-red-50 rounded-[32px] border border-red-100 p-8">
           <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 mr-4">
                 <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-red-900">5. Crisis Resources</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800">
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-red-50 transition-colors">
                 <div>
                    <h4 className="font-bold text-red-900 flex items-center">
                       9-8-8 Suicide Crisis
                       <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h4>
                    <p className="text-xs text-red-700">National 24/7 Helpline</p>
                 </div>
                 <a href="tel:988" className="p-3 bg-red-100 rounded-xl text-red-600 hover:bg-red-200 transition-colors">
                    <Phone className="w-5 h-5" />
                 </a>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between group cursor-pointer hover:bg-red-50 transition-colors">
                 <div>
                    <h4 className="font-bold text-red-900 flex items-center">
                       9-1-1 Emergency
                    </h4>
                    <p className="text-xs text-red-700">Immediate Danger</p>
                 </div>
                 <a href="tel:911" className="p-3 bg-red-100 rounded-xl text-red-600 hover:bg-red-200 transition-colors">
                    <Phone className="w-5 h-5" />
                 </a>
              </div>
           </div>
           <div className="mt-6 p-4 bg-white/50 rounded-2xl text-[10px] uppercase font-bold tracking-widest text-red-800">
              Note: This is a collaborative support tool and not a replacement for clinical crisis intervention.
           </div>
        </div>
      </div>
    </div>
  );
};
