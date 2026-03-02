import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "$/components/ui/button";
import { useSidebar } from "$/components/ui/sidebar";

export type FocusPageLayoutProps = {
  children: ReactNode;
  backLink?: string;
  backLabel?: string;
  autoCollapseSidebar?: boolean;
  autoCollapseMobileOnly?: boolean;
  title?: string;
  actions?: ReactNode;
};

/**
 * FocusPageLayout is a layout wrapper for complex pages that need more horizontal space.
 * It provides:
 * - Optional back navigation
 * - Auto-collapse sidebar for more space
 * - Expanded content area beyond default padding
 * - Optional header with title and actions
 *
 * Use this for:
 * - Sequence builder
 * - Report builder
 * - Email template editor
 * - Any other complex UI that needs a wide canvas
 *
 * @param autoCollapseSidebar - Whether to auto-collapse the sidebar (default: true)
 * @param autoCollapseMobileOnly - If true, only auto-collapse on mobile devices (default: false)
 */
export function FocusPageLayout({
  children,
  backLink,
  backLabel = "Back",
  autoCollapseSidebar = true,
  autoCollapseMobileOnly = false,
  title,
  actions,
}: FocusPageLayoutProps) {
  const { setOpen, open, isMobile } = useSidebar();

  useEffect(() => {
    // Auto-collapse sidebar to give more space to the focus content
    // Store the previous state so we can restore it on unmount
    const previousOpenState = open;

    // Determine if we should collapse based on mobile-only setting
    const shouldCollapse = autoCollapseSidebar && (!autoCollapseMobileOnly || isMobile);

    if (shouldCollapse) {
      setOpen(false);
    }

    // Restore sidebar state when leaving the focus page
    return () => {
      setOpen(previousOpenState);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCollapseSidebar, autoCollapseMobileOnly, isMobile]); // Intentionally not including setOpen and open to avoid loops

  return (
    <div className="focus-page w-full -mx-4 px-4">
      {/* Header with back navigation, title, and actions */}
      {(backLink || title || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {backLink && (
              <Button variant="ghost" asChild size="sm">
                <Link to={backLink}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backLabel}
                </Link>
              </Button>
            )}
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Main content area - full width */}
      <div className="focus-content min-h-[calc(100vh-12rem)]">
        {children}
      </div>
    </div>
  );
}

export default FocusPageLayout;

