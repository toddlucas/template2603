import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Cloud } from 'lucide-react';
import { Button } from '$/components/ui/button';
import { Input } from '$/components/ui/input';
import { Label } from '$/components/ui/label';
import { useOnboardingStore } from '#onboarding/store/onboardingStore';

export function ProjectNameStep() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    projectName,
    providerType,
    selectedFolder,
    selectedDrive,
    selectedSite,
    setProjectName,
    setStep,
    reset,
  } = useOnboardingStore();

  // Focus the input on mount.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleBack = () => {
    if (providerType === 'cloud') {
      setStep('provider');
    } else {
      setStep('browse');
    }
  };

  const handleCreate = () => {
    const name = projectName.trim();
    if (!name) return;
    const projectId = crypto.randomUUID();
    reset();
    navigate(`/workspace/${projectId}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate();
  };

  // Derive a source label for the summary line.
  const sourceLabel = (() => {
    if (providerType === 'cloud') return 'Cloud workspace';
    if (selectedFolder && !selectedFolder.isRoot) return selectedFolder.name;
    if (selectedDrive) return selectedDrive.name;
    if (selectedSite) return selectedSite.displayName;
    return null;
  })();

  return (
    <div className="space-y-6">
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
        <h2 className="text-lg font-semibold">Name your project</h2>
      </div>

      {/* Source summary */}
      {sourceLabel && (
        <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm">
          <Cloud className="size-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Source:</span>
          <span className="font-medium truncate">{sourceLabel}</span>
        </div>
      )}

      {/* Name input */}
      <div className="space-y-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input
          id="project-name"
          ref={inputRef}
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Q1 Proposal"
          className="text-base"
        />
        <p className="text-xs text-muted-foreground">
          You can rename this later.
        </p>
      </div>

      {/* Create button */}
      <Button
        className="w-full gap-2"
        onClick={handleCreate}
        disabled={!projectName.trim()}
      >
        Create project
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}
