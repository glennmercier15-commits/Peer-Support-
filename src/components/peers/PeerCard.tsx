import { FC } from 'react';
import { PeerProfile } from '../../types';
import { User, MapPin, Target, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const PeerCard: FC<{ peer: PeerProfile }> = ({ peer }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-md cursor-pointer group"
  >
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 mr-4">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-lg font-bold text-slate-900 leading-tight">
            {peer.firstName} {peer.lastInitial}.
          </h4>
          <p className="text-xs text-slate-500 font-medium">{peer.pronouns || 'N/A'}</p>
        </div>
      </div>
      <div className="px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        Active
      </div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex items-center text-xs text-slate-500">
        <MapPin className="w-3.5 h-3.5 mr-2 text-slate-400" />
        <span>Primary Goal: <span className="font-bold text-slate-700">{peer.supportGoals[0] || 'Unset'}</span></span>
      </div>
      <div className="flex items-center text-xs text-slate-500">
        <Target className="w-3.5 h-3.5 mr-2 text-slate-400" />
        <span>Recent Strength: <span className="font-bold text-slate-700">{peer.strengths[0] || 'Unset'}</span></span>
      </div>
    </div>

    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
      <p className="text-[10px] text-slate-400">Created: {new Date(peer.createdAt).toLocaleDateString()}</p>
      <div className="flex items-center text-teal-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
        View Profile <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  </motion.div>
);
