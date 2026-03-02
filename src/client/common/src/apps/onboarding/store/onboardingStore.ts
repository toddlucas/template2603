import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { OnboardingStep, ProviderType, SpSite, SpDrive, FolderItem } from '#onboarding/types';

interface OnboardingState {
  step: OnboardingStep;
  providerType: ProviderType | null;

  // Microsoft Graph token (access token, not ID token)
  graphToken: string | null;

  // Browse state
  selectedSite: SpSite | null;
  selectedDrive: SpDrive | null;
  selectedFolder: FolderItem | null;

  // Project creation
  projectName: string;

  // Async state for the connect step
  isConnecting: boolean;
  connectError: string | null;

  // Actions
  setStep: (step: OnboardingStep) => void;
  setProviderType: (type: ProviderType) => void;
  setGraphToken: (token: string) => void;
  setSelectedSite: (site: SpSite | null) => void;
  setSelectedDrive: (drive: SpDrive | null) => void;
  setSelectedFolder: (folder: FolderItem | null) => void;
  setProjectName: (name: string) => void;
  setConnecting: (connecting: boolean, error?: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'provider' as OnboardingStep,
  providerType: null,
  graphToken: null,
  selectedSite: null,
  selectedDrive: null,
  selectedFolder: null,
  projectName: '',
  isConnecting: false,
  connectError: null,
};

export const useOnboardingStore = create<OnboardingState>()(
  devtools(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ step }),
      setProviderType: (providerType) => set({ providerType }),
      setGraphToken: (graphToken) => set({ graphToken }),
      setSelectedSite: (selectedSite) => set({ selectedSite, selectedDrive: null, selectedFolder: null }),
      setSelectedDrive: (selectedDrive) => set({ selectedDrive, selectedFolder: null }),
      setSelectedFolder: (selectedFolder) => set({ selectedFolder }),
      setProjectName: (projectName) => set({ projectName }),
      setConnecting: (isConnecting, error = null) => set({ isConnecting, connectError: error }),
      reset: () => set(initialState),
    }),
    { name: 'onboarding-store' },
  ),
);

export const selectStep = (s: OnboardingState) => s.step;
export const selectProviderType = (s: OnboardingState) => s.providerType;
export const selectGraphToken = (s: OnboardingState) => s.graphToken;
export const selectSelectedSite = (s: OnboardingState) => s.selectedSite;
export const selectSelectedDrive = (s: OnboardingState) => s.selectedDrive;
export const selectSelectedFolder = (s: OnboardingState) => s.selectedFolder;
export const selectProjectName = (s: OnboardingState) => s.projectName;
