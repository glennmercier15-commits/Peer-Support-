import { useState } from 'react';
import { 
  HeartPulse, 
  LogIn, 
  Mail, 
  ShieldCheck, 
  ChevronRight,
  Globe,
  Building2
} from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { OperationType, handleFirestoreError } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const Login = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if user exists in Firestore
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, 'users', result.user.uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${result.user.uid}`);
        return;
      }

      if (!userDoc.exists()) {
        // Initial setup for new user
        const newUser = {
          name: result.user.displayName || 'Peer Specialist',
          email: result.user.email,
          role: 'specialist',
          orgId: 'default-org', // In a real app, they would join/create an org
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString()
        };
        
        try {
          await setDoc(doc(db, 'users', result.user.uid), newUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `users/${result.user.uid}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      {/* Visual Side */}
      <div className="md:w-1/2 bg-teal-600 relative overflow-hidden flex flex-col p-12 justify-between">
         <div className="relative z-10 flex items-center">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mr-3">
               <HeartPulse className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">PeerConnect Pro</h1>
         </div>

         <div className="relative z-10 max-w-lg">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-white leading-tight mb-6"
            >
              Support that <span className="text-teal-200">empowers</span> Canadians.
            </motion.h2>
            <p className="text-lg text-teal-50 mb-8 font-medium">
              A professional suite for peer support specialists, adhering to national recovery-oriented practice guidelines.
            </p>
            <div className="flex flex-wrap gap-4">
               <div className="flex items-center text-teal-100 text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/10">
                 <ShieldCheck className="w-4 h-4 mr-2" />
                 PHIPA/PIPEDA Compliant
               </div>
               <div className="flex items-center text-teal-100 text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/10">
                 <Globe className="w-4 h-4 mr-2" />
                 Canada-Wide Resource
               </div>
            </div>
         </div>

         <div className="relative z-10 text-[10px] uppercase font-bold tracking-widest text-teal-200 flex items-center">
            <Building2 className="w-3 h-3 mr-2" />
            Trusted by recovery organizations across Ontario & Canada
         </div>

         {/* Abstract background shapes */}
         <div className="absolute top-1/4 -right-20 w-96 h-96 bg-teal-400 rotate-45 blur-3xl opacity-20"></div>
         <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-800 rounded-full blur-3xl opacity-40"></div>
      </div>

      {/* Login Side */}
      <div className="md:w-1/2 flex items-center justify-center p-8 bg-white relative">
         <div className="max-w-md w-full space-y-10">
            <div className="text-center md:text-left">
               <h3 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h3>
               <p className="text-slate-500 font-medium italic">"Lived experience is our greatest strength."</p>
            </div>

            <div className="space-y-4">
               <button 
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm disabled:opacity-50"
               >
                 <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 mr-3" alt="Google" />
                 Continue with Google
               </button>
               
               <div className="relative flex items-center py-4">
                 <div className="flex-grow border-t border-slate-100"></div>
                 <span className="flex-shrink mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">or email access</span>
                 <div className="flex-grow border-t border-slate-100"></div>
               </div>

               <div className="space-y-4 opacity-50 pointer-events-none">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="email" className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl" placeholder="name@organization.ca" />
                     </div>
                  </div>
                  <button className="w-full p-4 bg-slate-100 text-slate-400 rounded-2xl font-bold flex items-center justify-center">
                    Proceed with Email
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </button>
               </div>
            </div>

            <div className="pt-8 border-t border-slate-50 text-center">
               <p className="text-sm text-slate-400">
                 New organization? <a href="#" className="text-teal-600 font-bold hover:underline">Get started here</a>
               </p>
            </div>
            
            <div className="mt-20 p-6 bg-slate-50 rounded-[24px] border border-slate-100">
               <div className="flex gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
               </div>
               <p className="text-[10px] leading-relaxed text-slate-500 italic">
                 This application securely stores peer support documentation. All data is protected under PIPEDA and provincial health information privacy acts (including PHIPA).
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};
