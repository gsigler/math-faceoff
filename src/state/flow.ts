import { create } from 'zustand';
import type { OperationKey } from '@/theme';
import type { Family, FamilyLookup } from '@/lib/types';

// Transient state shared across the onboarding + play flows (not persisted).
interface FlowState {
  // play selection
  selectedOperation: OperationKey;
  setOperation: (op: OperationKey) => void;

  // onboarding
  createdFamily: Family | null; // set after create_family (code screen)
  lookupResult: FamilyLookup | null; // set after lookup_family (found screen)
  setCreatedFamily: (f: Family | null) => void;
  setLookupResult: (f: FamilyLookup | null) => void;

  // which family the new player joins
  pendingFamilyId: string | null;
  setPending: (familyId: string) => void;

  reset: () => void;
}

export const useFlow = create<FlowState>((set) => ({
  selectedOperation: 'add',
  setOperation: (op) => set({ selectedOperation: op }),

  createdFamily: null,
  lookupResult: null,
  setCreatedFamily: (f) => set({ createdFamily: f }),
  setLookupResult: (f) => set({ lookupResult: f }),

  pendingFamilyId: null,
  setPending: (familyId) => set({ pendingFamilyId: familyId }),

  reset: () => set({ createdFamily: null, lookupResult: null, pendingFamilyId: null }),
}));
