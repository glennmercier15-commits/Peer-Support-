import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  Globe, 
  Phone, 
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  X,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Resource, ResourceCategory } from '../types';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDoc 
} from 'firebase/firestore';

export const ResourcesPage = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResourceCategory | 'All'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Housing' as ResourceCategory,
    description: '',
    province: 'Ontario',
    city: '',
    contactInfo: '',
    website: '',
    serviceType: ''
  });

  const categories: ResourceCategory[] = [
    'Housing', 'Employment', 'Food Security', 'Mental Health', 
    'Addiction Supports', 'Indigenous Services', 'LGBTQ2S+ Supports', 
    'Youth Services', 'Veteran Services', 'Senior Services', 
    'Legal Aid', 'Financial Assistance'
  ];

  const fetchResources = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const orgId = userDoc.data()?.orgId || 'default-org';

      const q = query(collection(db, 'resources'), where('orgId', '==', orgId));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setCreating(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const orgId = userDoc.data()?.orgId || 'default-org';

      await addDoc(collection(db, 'resources'), {
        ...formData,
        orgId
      });

      setShowAddModal(false);
      setFormData({
        name: '',
        category: 'Housing',
        description: '',
        province: 'Ontario',
        city: '',
        contactInfo: '',
        website: '',
        serviceType: ''
      });
      fetchResources();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'resources');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this resource from the directory?')) return;
    try {
      await deleteDoc(doc(db, 'resources', id));
      fetchResources();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `resources/${id}`);
    }
  };

  const filteredResources = resources.filter(r => 
    (selectedCategory === 'All' || r.category === selectedCategory) &&
    (r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
     r.city.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Resource Directory</h2>
          <p className="text-slate-500 mt-1">Searchable database of Canadian social and recovery services.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-teal-600 text-white rounded-2xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center justify-center whitespace-nowrap"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Resource
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-64 space-y-6 shrink-0">
          <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center px-3">
              <Filter className="w-3.5 h-3.5 mr-2" />
              Categories
            </h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  selectedCategory === 'All' ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                All Resources
              </button>
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    selectedCategory === cat ? 'bg-teal-50 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-teal-500 transition-colors" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, city, or service type..." 
              className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[28px] focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all shadow-sm font-medium text-slate-800"
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="py-32 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 px-10">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 className="w-8 h-8 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No resources found</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Try adjusting your category filter or search keywords.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredResources.map(resource => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={resource.id} 
                  className="bg-white p-8 rounded-[36px] border border-slate-200 shadow-sm flex flex-col group relative hover:border-teal-200 transition-all"
                >
                  <button 
                    onClick={() => handleDelete(resource.id)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-start justify-between mb-6">
                    <div className="p-4 bg-teal-50 rounded-[20px] text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1 rounded-full uppercase tracking-widest border border-teal-100">
                      {resource.category}
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-slate-900 mb-2">{resource.name}</h4>
                  {resource.serviceType && (
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3">{resource.serviceType}</p>
                  )}
                  <p className="text-sm text-slate-500 leading-relaxed mb-8 flex-1">{resource.description}</p>
                  
                  <div className="space-y-3 pt-6 border-t border-slate-50">
                    <div className="flex items-center text-xs text-slate-700 font-bold">
                      <MapPin className="w-4 h-4 mr-3 text-slate-400" />
                      {resource.city}, {resource.province}
                    </div>
                    <div className="flex items-center text-xs text-slate-700 font-bold">
                      <Phone className="w-4 h-4 mr-3 text-slate-400" />
                      {resource.contactInfo}
                    </div>
                    {resource.website && (
                      <a 
                        href={resource.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-xs text-teal-600 font-bold hover:text-teal-700 transition-colors"
                      >
                        <Globe className="w-4 h-4 mr-3" />
                        Visit Website
                        <ExternalLink className="w-3 h-3 ml-2" />
                      </a>
                    )}
                  </div>

                  <button className="mt-8 w-full py-4 rounded-2xl bg-slate-50 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center">
                    Get Details <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => !creating && setShowAddModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
             <motion.div
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative bg-white rounded-[44px] shadow-2xl p-10 max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden"
             >
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-slate-900 mb-1">Add to Directory</h3>
                    <p className="text-slate-500 font-medium">Contribute a new service to the community resource map.</p>
                  </div>
                  <button 
                    onClick={() => setShowAddModal(false)}
                    className="p-3 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-6 overflow-y-auto pr-4 custom-scrollbar">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization Name</label>
                        <input 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                          placeholder="e.g. Toronto Community Food Bank"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          value={formData.category}
                          onChange={(e) => setFormData({...formData, category: e.target.value as ResourceCategory})}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold appearance-none"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                      <textarea 
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold placeholder:text-slate-300 resize-none"
                        placeholder="Briefly describe the services offered..."
                      />
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                        <input 
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Province</label>
                        <select 
                          value={formData.province}
                          onChange={(e) => setFormData({...formData, province: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                        >
                          {['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'PEI', 'Newfoundland', 'Territories', 'Canada-Wide'].map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone / Contact</label>
                        <input 
                          required
                          value={formData.contactInfo}
                          onChange={(e) => setFormData({...formData, contactInfo: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Website URL</label>
                        <input 
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                          placeholder="https://"
                        />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Service Type Accent</label>
                      <input 
                        value={formData.serviceType}
                        onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-2 focus:ring-teal-500 text-slate-800 font-bold"
                        placeholder="e.g. 24/7 Crisis Line, Drop-in, etc."
                      />
                   </div>

                   <div className="flex gap-4 pt-6">
                      <button 
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-5 border-2 border-slate-100 rounded-[24px] text-slate-500 font-bold hover:bg-slate-50 transition-colors"
                      >
                        Discard
                      </button>
                      <button 
                        type="submit"
                        disabled={creating}
                        className="flex-1 py-5 bg-teal-600 text-white rounded-[24px] font-extrabold shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all flex items-center justify-center disabled:opacity-50"
                      >
                        {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register Resource'}
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

