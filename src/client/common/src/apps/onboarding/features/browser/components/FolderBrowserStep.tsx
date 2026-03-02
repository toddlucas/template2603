import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '$/components/ui/button';
import { useOnboardingStore } from '#onboarding/store/onboardingStore';
import { listDrives } from '#onboarding/api/graphApi';
import { SiteList } from './SiteList';
import { DriveRootItem } from './FolderTree';
import type { SpSite, SpDrive, FolderItem } from '#onboarding/types';

type BrowseView = 'sites' | 'drives' | 'folders';

export function FolderBrowserStep() {
  const {
    graphToken,
    selectedSite,
    selectedDrive,
    selectedFolder,
    setSelectedSite,
    setSelectedDrive,
    setSelectedFolder,
    setProjectName,
    setStep,
  } = useOnboardingStore();

  const [view, setView] = useState<BrowseView>('sites');
  const [drives, setDrives] = useState<SpDrive[]>([]);
  const [loadingDrives, setLoadingDrives] = useState(false);
  const [drivesError, setDrivesError] = useState<string | null>(null);

  const token = graphToken ?? '';

  // When a site is selected, load its drives.
  useEffect(() => {
    if (!selectedSite) return;
    setLoadingDrives(true);
    setDrivesError(null);
    listDrives(selectedSite.id, token)
      .then((result) => {
        setDrives(result);
        // If there's only one drive, skip the drive picker and go straight to folders.
        if (result.length === 1) {
          setSelectedDrive(result[0]);
          setView('folders');
        } else {
          setView('drives');
        }
      })
      .catch((err) => {
        setDrivesError(err instanceof Error ? err.message : 'Failed to load document libraries.');
        setView('drives');
      })
      .finally(() => setLoadingDrives(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSite?.id]);

  const handleSiteSelect = (site: SpSite) => {
    setSelectedSite(site);
    // Effect above handles the transition.
  };

  const handleDriveSelect = (drive: SpDrive) => {
    setSelectedDrive(drive);
    setView('folders');
  };

  const handleFolderSelect = (folder: FolderItem) => {
    setSelectedFolder(folder);
  };

  const handleUseFolder = () => {
    if (!selectedFolder) return;
    // Pre-fill project name from the folder name (root drive name if root selected).
    const name = selectedFolder.isRoot
      ? (selectedDrive?.name ?? selectedSite?.displayName ?? '')
      : selectedFolder.name;
    setProjectName(name);
    setStep('name');
  };

  const handleBack = () => {
    if (view === 'folders') {
      if (drives.length === 1) {
        setSelectedSite(null);
        setView('sites');
      } else {
        setSelectedDrive(null);
        setView('drives');
      }
    } else if (view === 'drives') {
      setSelectedSite(null);
      setView('sites');
    } else {
      setStep('provider');
    }
  };

  // Breadcrumb labels
  const breadcrumbs: string[] = [];
  if (selectedSite) breadcrumbs.push(selectedSite.displayName);
  if (selectedDrive && view === 'folders') breadcrumbs.push(selectedDrive.name);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-full p-1.5 hover:bg-muted transition-colors text-muted-foreground"
          aria-label="Back"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold">
            {view === 'sites' && 'Select a site'}
            {view === 'drives' && 'Select a document library'}
            {view === 'folders' && 'Select a folder'}
          </h2>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="size-3" />}
                  <span className="truncate max-w-[160px]">{crumb}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="max-h-72 overflow-y-auto p-2">
          {view === 'sites' && (
            <SiteList token={token} onSelect={handleSiteSelect} />
          )}

          {view === 'drives' && (
            <>
              {loadingDrives ? (
                <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Loading libraries…
                </div>
              ) : drivesError ? (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive m-2">
                  <AlertCircle className="size-4 shrink-0" />
                  {drivesError}
                </div>
              ) : (
                <div className="space-y-1">
                  {drives.map((drive) => (
                    <button
                      key={drive.id}
                      type="button"
                      onClick={() => handleDriveSelect(drive)}
                      className="w-full flex items-center gap-3 rounded-lg px-4 py-3 text-left hover:bg-muted transition-colors"
                    >
                      <span className="flex-1 text-sm font-medium truncate">{drive.name}</span>
                      <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {view === 'folders' && selectedDrive && (
            <DriveRootItem
              driveId={selectedDrive.id}
              driveName={selectedDrive.name}
              siteId={selectedSite?.id ?? null}
              token={token}
              selectedId={selectedFolder?.id ?? null}
              onSelect={handleFolderSelect}
            />
          )}
        </div>
      </div>

      {/* Selection footer */}
      {view === 'folders' && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-sm text-muted-foreground truncate">
            {selectedFolder ? (
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-primary shrink-0" />
                <span className="font-medium text-foreground truncate">
                  {selectedFolder.isRoot ? selectedDrive?.name : selectedFolder.name}
                </span>
                <span className="text-muted-foreground">selected</span>
              </span>
            ) : (
              'Select a folder above'
            )}
          </p>
          <Button
            size="sm"
            disabled={!selectedFolder}
            onClick={handleUseFolder}
            className="shrink-0"
          >
            Use this folder
          </Button>
        </div>
      )}
    </div>
  );
}
