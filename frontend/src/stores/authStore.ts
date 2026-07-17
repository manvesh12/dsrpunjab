import { create } from 'zustand';
import type { User, UserRole } from '../types/auth.types';

export const SEED_USERS: User[] = [
  { id: '1', name: 'Super Admin User', email: 'superadmin@dsr.gov.in', role: 'Super Admin', district: 'All' },
  { id: '2', name: 'State Admin User', email: 'stateadmin@dsr.gov.in', role: 'State Admin', district: 'Punjab' },
  { id: '3', name: 'District Admin Patiala', email: 'dmo.patiala@dsr.gov.in', role: 'District Admin', district: 'Patiala' },
  { id: '4', name: 'Survey Lead Patiala', email: 'surveylead.patiala@dsr.gov.in', role: 'Survey Lead', district: 'Patiala' },
  { id: '5', name: 'Field Surveyor Patiala', email: 'surveyor.patiala@dsr.gov.in', role: 'Field Surveyor', district: 'Patiala' },
  { id: '6', name: 'Data Entry Patiala', email: 'dataentry.patiala@dsr.gov.in', role: 'Data Entry', district: 'Patiala' },
  { id: '7', name: 'GIS Expert Patiala', email: 'gis.patiala@dsr.gov.in', role: 'GIS Expert', district: 'Patiala' },
  { id: '8', name: 'Geologist Patiala', email: 'geologist.patiala@dsr.gov.in', role: 'Geologist', district: 'Patiala' },
  { id: '9', name: 'Environment Patiala', email: 'environment.patiala@dsr.gov.in', role: 'Environment', district: 'Patiala' },
  { id: '10', name: 'Reviewer Patiala', email: 'reviewer.patiala@dsr.gov.in', role: 'Reviewer', district: 'Patiala' },
  { id: '11', name: 'Approver Patiala', email: 'approver.patiala@dsr.gov.in', role: 'Approver', district: 'Patiala' },
  { id: '12', name: 'Auditor Patiala', email: 'auditor.patiala@dsr.gov.in', role: 'Auditor', district: 'Patiala' },
];

interface AuthState {
  user: User | null;
  users: User[];
  loginAs: (userId: string) => void;
  logout: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: SEED_USERS[0], // Logged in as Super Admin by default
  users: SEED_USERS,
  
  loginAs: (userId) => set((state) => ({ 
    user: state.users.find(u => u.id === userId) || null 
  })),
  
  logout: () => set({ user: null }),
  
  updateUserRole: (userId, newRole) => set((state) => ({
    users: state.users.map(u => u.id === userId ? { ...u, role: newRole } : u)
  }))
}));
