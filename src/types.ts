/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'specialist' | 'supervisor' | 'admin';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  orgId: string;
  createdAt: string;
  lastActive: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  subscriptionPlan: 'free' | 'pro' | 'enterprise';
}

export interface PeerProfile {
  id: string;
  firstName: string;
  lastInitial: string;
  preferredName?: string;
  pronouns?: string;
  contactInfo?: string;
  emergencyContact?: string;
  orgId: string;
  specialistId: string;
  supportGoals: string[];
  strengths: string[];
  interests: string[];
  notes?: string;
  createdAt: string;
}

export interface Interaction {
  id: string;
  peerId: string;
  specialistId: string;
  orgId: string;
  date: string;
  time?: string;
  location?: string;
  type: 'in-person' | 'phone' | 'virtual' | 'text';
  notes: string;
  aiSummary?: string;
  discussionTopics: string[];
  strengthsIdentified: string[];
  goalsDiscussed: string[];
  actionItems: string[];
  followUpDate?: string;
}

export interface Goal {
  id: string;
  peerId: string;
  orgId: string;
  title: string;
  category: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface SafetyPlan {
  id: string;
  peerId: string;
  orgId: string;
  warningSigns: string[];
  copingStrategies: string[];
  supportPeople: string[];
  safePlaces: string[];
  helpfulActivities: string[];
  emergencyContacts: string[];
  updatedAt: string;
}

export interface WellnessCheck {
  id: string;
  userId: string;
  date: string;
  stress: number;
  burnoutRisk: number;
  compassionFatigue: number;
  mood: number;
  energy: number;
  notes?: string;
}

export interface SelfCarePlan {
  id: string;
  userId: string;
  warningSigns: string[];
  triggers: string[];
  copingSkills: string[];
  personalSupports: string[];
  professionalSupports: string[];
  rechargeActivities: string[];
  updatedAt: string;
}

export interface ChatRoom {
  id: string;
  orgId: string;
  participants: string[];
  lastMessage?: string;
  lastActivity: string;
  type: 'direct' | 'group';
  name?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export type ResourceCategory = 
  | 'Housing' 
  | 'Employment' 
  | 'Food Security' 
  | 'Mental Health' 
  | 'Addiction Supports' 
  | 'Indigenous Services' 
  | 'LGBTQ2S+ Supports' 
  | 'Youth Services' 
  | 'Veteran Services' 
  | 'Senior Services' 
  | 'Legal Aid' 
  | 'Financial Assistance';

export interface Resource {
  id: string;
  name: string;
  category: ResourceCategory;
  description: string;
  province: string;
  city: string;
  contactInfo: string;
  website?: string;
  serviceType: string;
}
