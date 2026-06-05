import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  LifeBuoy, 
  Heart,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  Loader2,
  Sparkles,
  Zap,
  Moon,
  Wind
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { SelfCarePlan } from '../types';
import { useNavigate } from 'react-router-dom';

export const SelfCarePlanBuilder = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<string | null>(null);

  const [warningSigns, setWarningSigns] = useState(['']);
  const [triggers, setTriggers] = useState(['']);
  const [copingSkills, setCopingSkills] = useState(['']);
  const [personalSupports, setPersonalSupports] = useState(['']);
  const [professionalSupports, setProfessionalSupports] = useState(['']);
  const [rechargeActivities, setRechargeActivities] = useState(['']);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, 'self_care_plans'), where('userId', '==', auth.currentUser.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = snap.docs[0].data() as SelfCarePlan;
          setPlanId(snap.docs[0].id);
          setWarningSigns(data.warningSigns || ['']);
          setTriggers(data.triggers || ['']);
          setCopingSkills(data.copingSkills || ['']);
          setPersonalSupports(data.personalSupports || ['']);
          setProfessionalSupports(data.professionalSupports || ['']);
          setRechargeActivities(data.rechargeActivities || ['']);
        }
      } catch (err) {
        console.error('Error fetching self-care plan:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    setIsSaving(true);
    try {
      const planData: Omit<SelfCarePlan, 'id'> = {
        userId: auth.currentUser.uid,
        warningSigns: warningSigns.filter(s => s.trim()),
        triggers: triggers.filter(s => s.trim()),
        copingSkills: copingSkills.filter(s => s.trim()),
        personalSupports: personalSupports.filter(s => s.trim()),
        professionalSupports: professionalSupports.filter(s => s.trim()),
        rechargeActivities: rechargeActivities.filter(s => s.trim()),
        updatedAt: new Date().toISOString()
      };

      if (planId) {
        await updateDoc(doc(db, 'self_care_plans', planId), planData);
      } else {
        await addDoc(collection(db, 'self_care_plans'), planData);
      }
      
      alert('Your Self-Care Respite Plan has been updated. Peace is a practice.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'self_care_plans');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (list: string[], setter: (v: string[]) => void) => setter([...list, '']);
  const updateItem = (list: string[], setter: (v: string[]) => void, index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setter(newList);
  };
  const removeItem = (list: string[], setter: (v: string[]) => void, index: number) => {
    const newList = list.filter((_, i) => i !== index);
    setter(newList.length === 0 ? [''] : newList);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div 
            onClick={() => navigate('/wellness')}
            className="flex items-center text-slate-500 hover:text-teal-600 transition-colors cursor-pointer group mb-4 w-fit"
          >
            <ChevronLeft className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-xs uppercase tracking-widest">Back to Wellness Hub</span>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Personal Respite Plan</h2>
          <p className="text-slate-500 mt-2 font-medium">Your private strategy for maintaining balance as a peer specialist.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-4 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-3 text-teal-400" />}
          {planId ? 'Update Plan' : 'Initialize Plan'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Warning Signs */}
        <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 group hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mr-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Warning Signs</h3>
            </div>
            <button onClick={() => addItem(warningSigns, setWarningSigns)} className="p-3 bg-slate-50 rounded-xl text-teal-600 hover:bg-teal-50">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {warningSigns.map((val, i) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={val} 
                  onChange={(e) => updateItem(warningSigns, setWarningSigns, i, e.target.value)}
                  className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold placeholder:text-slate-300"
                  placeholder="e.g. Irritability with paperwork..."
                />
                <button onClick={() => removeItem(warningSigns, setWarningSigns, i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Triggers */}
        <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 group hover:border-red-200 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mr-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Personal Triggers</h3>
            </div>
            <button onClick={() => addItem(triggers, setTriggers)} className="p-3 bg-slate-50 rounded-xl text-teal-600 hover:bg-teal-50">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {triggers.map((val, i) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={val} 
                  onChange={(e) => updateItem(triggers, setTriggers, i, e.target.value)}
                  className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-red-500 text-slate-800 text-sm font-bold placeholder:text-slate-300"
                  placeholder="e.g. Unresolved housing themes..."
                />
                <button onClick={() => removeItem(triggers, setTriggers, i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Coping Skills */}
        <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 group hover:border-teal-200 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mr-4">
                <Wind className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Coping Skills</h3>
            </div>
            <button onClick={() => addItem(copingSkills, setCopingSkills)} className="p-3 bg-slate-50 rounded-xl text-teal-600 hover:bg-teal-50">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {copingSkills.map((val, i) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={val} 
                  onChange={(e) => updateItem(copingSkills, setCopingSkills, i, e.target.value)}
                  className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 text-slate-800 text-sm font-bold placeholder:text-slate-300"
                  placeholder="e.g. 10-minute sun break..."
                />
                <button onClick={() => removeItem(copingSkills, setCopingSkills, i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recharge Activities */}
        <section className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-10 group hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mr-4">
                <Moon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Recharge Habits</h3>
            </div>
            <button onClick={() => addItem(rechargeActivities, setRechargeActivities)} className="p-3 bg-slate-50 rounded-xl text-teal-600 hover:bg-teal-50">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {rechargeActivities.map((val, i) => (
              <div key={i} className="flex gap-3">
                <input 
                  type="text" 
                  value={val} 
                  onChange={(e) => updateItem(rechargeActivities, setRechargeActivities, i, e.target.value)}
                  className="flex-1 px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-bold placeholder:text-slate-300"
                  placeholder="e.g. Turning off work phone at 5pm..."
                />
                <button onClick={() => removeItem(rechargeActivities, setRechargeActivities, i)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Support Systems */}
      <div className="bg-teal-900 rounded-[48px] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 blur-[100px] rounded-full" />
        
        <div className="flex items-center mb-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mr-6">
            <Shield className="w-8 h-8 text-teal-300" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Your Support Perimeter</h3>
            <p className="text-teal-400 font-bold text-xs uppercase tracking-widest mt-1">Safety networks for the specialist</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500">Personal Support (Friends/Family)</h4>
            <div className="space-y-4">
              {personalSupports.map((val, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    value={val} 
                    onChange={(e) => updateItem(personalSupports, setPersonalSupports, i, e.target.value)}
                    className="flex-1 px-6 py-4 bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-teal-400 text-white text-sm font-bold placeholder:text-teal-800"
                    placeholder="Name & Relationship..."
                  />
                  <button onClick={() => removeItem(personalSupports, setPersonalSupports, i)} className="p-2 text-teal-800 hover:text-white transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addItem(personalSupports, setPersonalSupports)}
                className="w-full py-4 border border-teal-800 border-dashed rounded-2xl text-teal-600 font-bold text-xs hover:border-teal-400 hover:text-teal-400 transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Support Person
              </button>
            </div>
          </div>

          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-500">Professional Support (Supervision/Counseling)</h4>
             <div className="space-y-4">
              {professionalSupports.map((val, i) => (
                <div key={i} className="flex gap-3 items-center">
                  <input 
                    type="text" 
                    value={val} 
                    onChange={(e) => updateItem(professionalSupports, setProfessionalSupports, i, e.target.value)}
                    className="flex-1 px-6 py-4 bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-teal-400 text-white text-sm font-bold placeholder:text-teal-800"
                    placeholder="Supervisor Name or Service..."
                  />
                  <button onClick={() => removeItem(professionalSupports, setProfessionalSupports, i)} className="p-2 text-teal-800 hover:text-white transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addItem(professionalSupports, setProfessionalSupports)}
                className="w-full py-4 border border-teal-800 border-dashed rounded-2xl text-teal-600 font-bold text-xs hover:border-teal-400 hover:text-teal-400 transition-all flex items-center justify-center"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Professional Support
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-[40px] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mr-6 border border-emerald-100">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-slate-900">Self-Compassion Reminder</h4>
            <p className="text-slate-500 font-medium italic mt-1">"I cannot pour from an empty cup. My well-being is my clinical priority."</p>
          </div>
        </div>
        <div className="flex items-center px-6 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-500 mr-2" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Resilience Certified</span>
        </div>
      </div>
    </div>
  );
};
