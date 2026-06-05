import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Wind, 
  Moon, 
  Brain, 
  Timer,
  RefreshCcw,
  Zap
} from 'lucide-react';

interface RechargePortalProps {
  type: 'Box Breathing' | 'Grounding (5-4-3-2-1)' | 'Digital Detox' | null;
  onClose: () => void;
}

export const RechargePortal = ({ type, onClose }: RechargePortalProps) => {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Box Breathing Logic
  const breathingSteps = [
    { text: 'Inhale Slowly', instruction: 'Through your nose', duration: 4 },
    { text: 'Hold Breath', instruction: 'Stay steady', duration: 4 },
    { text: 'Exhale Fully', instruction: 'Through your mouth', duration: 4 },
    { text: 'Hold Empty', instruction: 'Peaceful pause', duration: 4 }
  ];

  useEffect(() => {
    let interval: any;
    if (type === 'Box Breathing' && isActive) {
      interval = setInterval(() => {
        setStep(prev => (prev + 1) % 4);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [type, isActive]);

  // Digital Detox Timer
  useEffect(() => {
    let interval: any;
    if (type === 'Digital Detox' && timeLeft > 0 && isActive) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [type, timeLeft, isActive]);

  const startSession = () => {
    setIsActive(true);
    if (type === 'Digital Detox') setTimeLeft(15 * 60);
    if (type === 'Box Breathing') setStep(0);
  };

  if (!type) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl"
    >
      <div className="max-w-2xl w-full bg-white rounded-[48px] overflow-hidden shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-12 md:p-20 flex flex-col items-center text-center">
          {isActive ? (
            <div className="w-full">
              {type === 'Box Breathing' && (
                <div className="space-y-12">
                  <div className="relative flex items-center justify-center h-64">
                    <motion.div 
                      animate={{ 
                        scale: step === 0 ? 1.5 : step === 1 ? 1.5 : step === 2 ? 1 : 1,
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-40 h-40 bg-teal-500/20 rounded-full blur-3xl"
                    />
                    <motion.div 
                      key={step}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="relative z-10 space-y-4"
                    >
                      <h3 className="text-6xl font-black text-slate-900 leading-none">{breathingSteps[step].text}</h3>
                      <p className="text-teal-600 font-black uppercase tracking-[0.3em] text-xs underline underline-offset-8">
                        {breathingSteps[step].instruction}
                      </p>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-center gap-4">
                    {breathingSteps.map((_, i) => (
                      <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i === step ? 'bg-teal-500 scale-150' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                </div>
              )}

              {type === 'Digital Detox' && (
                <div className="space-y-10">
                   <div className="w-24 h-24 bg-slate-50 text-slate-900 rounded-3xl flex items-center justify-center mx-auto mb-8">
                      <Moon className="w-10 h-10 animate-pulse" />
                   </div>
                   <div>
                     <span className="text-8xl font-black text-slate-900 tracking-tighter">
                       {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                     </span>
                     <p className="text-slate-400 font-bold uppercase tracking-widest mt-4">Screen-free focus time</p>
                   </div>
                   <p className="text-slate-500 max-w-sm mx-auto italic font-medium">
                     "Give your mind the same courtesy you give your phone: a chance to recharge without interruptions."
                   </p>
                </div>
              )}

              {type === 'Grounding (5-4-3-2-1)' && (
                <div className="space-y-8">
                  {[
                    { n: 5, t: 'Things you can SEE' },
                    { n: 4, t: 'Things you can TOUCH' },
                    { n: 3, t: 'Things you can HEAR' },
                    { n: 2, t: 'Things you can SMELL' },
                    { n: 1, t: 'Thing you can TASTE' }
                  ].map((g, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.2 }}
                      key={i} 
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl"
                    >
                      <span className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-teal-600 shadow-sm">{g.n}</span>
                      <span className="font-bold text-slate-700">{g.t}</span>
                    </motion.div>
                  ))}
                  <button 
                    onClick={onClose}
                    className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    Found my footing
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-[32px] flex items-center justify-center mx-auto shadow-sm">
                {type === 'Box Breathing' && <Wind className="w-12 h-12" />}
                {type === 'Digital Detox' && <Moon className="w-12 h-12" />}
                {type === 'Grounding (5-4-3-2-1)' && <Brain className="w-12 h-12" />}
              </div>
              
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{type}</h3>
                <p className="text-slate-500 mt-2 font-medium max-w-md mx-auto">
                  Take a moment to reset. This practice is designed to quickly lower your cognitive load.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={startSession}
                  className="px-12 py-5 bg-teal-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-sm hover:bg-teal-700 transition-all shadow-xl shadow-teal-100 flex items-center justify-center"
                >
                  <Zap className="w-5 h-5 mr-3" />
                  Begin Session
                </button>
                <div className="flex items-center justify-center text-slate-400">
                  <Timer className="w-4 h-4 mr-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Estimated duration: {type === 'Digital Detox' ? '15m' : type === 'Box Breathing' ? '2m' : '5m'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-2 bg-slate-100 w-full overflow-hidden">
           {isActive && (
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: '100%' }}
               transition={{ duration: type === 'Digital Detox' ? 15*60 : type === 'Box Breathing' ? 120 : 300 }}
               className="h-full bg-teal-500"
             />
           )}
        </div>
      </div>
    </motion.div>
  );
};
