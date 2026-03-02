import { useEffect, useState } from 'react';
import { Building2, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { listSites } from '#onboarding/api/graphApi';
import type { SpSite } from '#onboarding/types';

interface SiteListProps {
  token: string;
  onSelect: (site: SpSite) => void;
}

export function SiteList({ token, onSelect }: SiteListProps) {
  const [sites, setSites] = useState<SpSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listSites(token)
      .then((result) => {
        if (!cancelled) setSites(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load sites.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading sites…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertCircle className="size-4 shrink-0" />
        {error}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No SharePoint sites found. Make sure you have access to at least one site.
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {sites.map((site) => (
        <button
          key={site.id}
          type="button"
          onClick={() => onSelect(site)}
          className="w-full flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-left hover:bg-muted transition-colors"
        >
          <Building2 className="size-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{site.displayName}</p>
            {site.description && (
              <p className="text-xs text-muted-foreground truncate">{site.description}</p>
            )}
          </div>
          <ChevronRight className="size-4 text-muted-foreground shrink-0" />
        </button>
      ))}
    </div>
  );
}
