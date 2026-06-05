import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export const StatsCard = ({ label, value, icon: Icon, trend, trendUp }: StatsCardProps) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between"
  >
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {trend && (
        <div className={`flex items-center mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-slate-400'}`}>
          <span className="flex items-center bg-emerald-50 px-1.5 py-0.5 rounded-md mr-1.5">
            {trendUp ? '↑' : '↓'} {trend}
          </span>
          <span>from last month</span>
        </div>
      )}
    </div>
    <div className="p-3 bg-teal-50 rounded-xl">
      <Icon className="w-6 h-6 text-teal-600" />
    </div>
  </motion.div>
);
