// Onboarding wizard steps
export type OnboardingStep = 'provider' | 'browse' | 'name';

// Which storage provider the user selected
export type ProviderType = 'microsoft' | 'cloud';

// A SharePoint site returned from Graph API
export interface SpSite {
  id: string;
  displayName: string;
  webUrl: string;
  description?: string;
}

// A OneDrive drive within a site
export interface SpDrive {
  id: string;
  name: string;
  driveType: 'documentLibrary' | 'personal' | 'business' | string;
  webUrl: string;
}

// A folder (or drive root) item from Graph API
export interface FolderItem {
  id: string;
  name: string;
  webUrl: string;
  parentDriveId: string;
  parentSiteId: string | null;
  isRoot: boolean;
  childCount?: number;
}
