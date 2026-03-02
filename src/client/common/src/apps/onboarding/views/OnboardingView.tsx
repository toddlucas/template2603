import { useOnboardingStore, selectStep } from '#onboarding/store/onboardingStore';
import { ProviderPickerStep } from '#onboarding/features/provider/components/ProviderPickerStep';
import { FolderBrowserStep } from '#onboarding/features/browser/components/FolderBrowserStep';
import { ProjectNameStep } from '#onboarding/features/project/components/ProjectNameStep';
import type { OnboardingStep } from '#onboarding/types';

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 'provider', label: 'Connect' },
  { id: 'browse', label: 'Browse' },
  { id: 'name', label: 'Name' },
];

function StepIndicator({ current }: { current: OnboardingStep }) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isActive = i === currentIndex;
        return (
          <div key={step.id} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={`size-2 rounded-full transition-colors ${
                  isDone
                    ? 'bg-primary'
                    : isActive
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  isActive
                    ? 'text-foreground font-medium'
                    : isDone
                    ? 'text-muted-foreground'
                    : 'text-muted-foreground/50'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-6 transition-colors ${
                  isDone ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OnboardingView() {
  const step = useOnboardingStore(selectStep);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo / brand mark */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✦</span>
          </div>
          <h1 className="text-2xl font-bold">Get started with Product Name</h1>
        </div>

        {/* Step indicator — hide the browse step indicator when on cloud path */}
        <div className="flex justify-center">
          <StepIndicator current={step} />
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === 'provider' && <ProviderPickerStep />}
          {step === 'browse' && <FolderBrowserStep />}
          {step === 'name' && <ProjectNameStep />}
        </div>
      </div>
    </div>
  );
}
