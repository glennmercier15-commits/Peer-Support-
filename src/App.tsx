/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { PeersList } from './pages/Peers';
import { InteractionsList } from './pages/Interactions';
import { InteractionForm } from './pages/InteractionForm';
import { SafetyPlanBuilder } from './pages/SafetyPlanBuilder';
import { ResourcesPage } from './pages/Resources';
import { WellnessHub } from './pages/WellnessHub';
import { SelfCarePlanBuilder } from './pages/SelfCarePlanBuilder';
import { AIAssistantChat } from './pages/AIAssistant';
import { PeerChat } from './pages/PeerChat';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';
import { GoalsTracker } from './pages/GoalsTracker';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Login />;

  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/peers" element={<PeersList />} />
          <Route path="/interactions" element={<InteractionsList />} />
          <Route path="/interactions/new" element={<InteractionForm />} />
          <Route path="/goals" element={<GoalsTracker />} />
          <Route path="/safety" element={<SafetyPlanBuilder />} />
          <Route path="/assistant" element={<AIAssistantChat />} />
          <Route path="/chat" element={<PeerChat />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/wellness" element={<WellnessHub />} />
          <Route path="/wellness/plan" element={<SelfCarePlanBuilder />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
