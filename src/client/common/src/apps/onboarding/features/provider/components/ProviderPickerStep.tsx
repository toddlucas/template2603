import { Cloud, ArrowRight } from 'lucide-react';
import { Button } from '$/components/ui/button';
import { useOnboardingStore } from '#onboarding/store/onboardingStore';
import { getGraphToken, listSites } from '#onboarding/api/graphApi';

const MicrosoftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 21 21"
    className="size-5 shrink-0"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

export function ProviderPickerStep() {
  const {
    isConnecting,
    connectError,
    setConnecting,
    setGraphToken,
    setProviderType,
    setStep,
  } = useOnboardingStore();

  const handleConnectMicrosoft = async () => {
    setConnecting(true, null);
    try {
      const token = await getGraphToken();
      // Eagerly fetch sites so the browse step loads instantly.
      await listSites(token);
      setGraphToken(token);
      setProviderType('microsoft');
      setStep('browse');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to connect Microsoft 365.';
      // User cancelling the popup is not an error worth surfacing.
      const isSilent =
        message.includes('user_cancelled') || message.includes('interaction_in_progress');
      setConnecting(false, isSilent ? null : message);
    }
  };

  const handleCloudWorkspace = () => {
    setProviderType('cloud');
    setStep('name');
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">Connect your documents</h2>
        <p className="text-sm text-muted-foreground">
          Product Name reads and edits files directly from your cloud storage — nothing
          is copied or stored outside your existing provider.
        </p>
      </div>

      <div className="space-y-3">
        {/* Microsoft 365 */}
        <button
          type="button"
          onClick={handleConnectMicrosoft}
          disabled={isConnecting}
          className="w-full flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
        >
          <MicrosoftIcon />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Connect Microsoft 365</p>
            <p className="text-xs text-muted-foreground">OneDrive &amp; SharePoint</p>
          </div>
          {isConnecting ? (
            <span className="text-xs text-muted-foreground animate-pulse">Connecting…</span>
          ) : (
            <ArrowRight className="size-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {/* Google Drive — coming soon */}
        <div className="w-full flex items-center gap-4 rounded-xl border border-border bg-card/50 px-5 py-4 opacity-50 cursor-not-allowed select-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 87.3 78"
            className="size-5 shrink-0"
            aria-hidden="true"
          >
            <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da" />
            <path d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C.4 49.9 0 51.45 0 53h27.5z" fill="#00ac47" />
            <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z" fill="#ea4335" />
            <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d" />
            <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc" />
            <path d="M73.4 26.5l-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Connect Google Drive</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>

      {connectError && (
        <p className="text-sm text-destructive text-center rounded-md bg-destructive/10 px-3 py-2">
          {connectError}
        </p>
      )}

      {/* Cloud workspace fallback */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-center text-muted-foreground">
          Don't have a cloud storage provider? Start with a cloud workspace and
          connect a provider later.
        </p>
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleCloudWorkspace}
          disabled={isConnecting}
        >
          <Cloud className="size-4" />
          Start with a cloud workspace
        </Button>
      </div>
    </div>
  );
}
