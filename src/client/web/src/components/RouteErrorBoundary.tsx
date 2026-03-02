import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Button } from '$/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '$/components/ui/card';
import { AlertCircleIcon, HomeIcon, RefreshCwIcon } from 'lucide-react';

/**
 * RouteErrorBoundary component for handling React Router errors.
 * This component uses useRouteError() to catch and display routing errors
 * with a user-friendly interface.
 */
export const RouteErrorBoundary = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  // Determine error details
  let title = 'Something went wrong';
  let message = 'An unexpected error occurred. Please try again.';
  let statusCode: number | null = null;
  let stackTrace: string | undefined;

  if (isRouteErrorResponse(error)) {
    // Router-specific errors (404, 403, etc.)
    statusCode = error.status;
    title = error.statusText || `Error ${error.status}`;
    
    if (error.status === 404) {
      title = 'Page Not Found';
      message = "The page you're looking for doesn't exist or has been moved.";
    } else if (error.status === 403) {
      title = 'Access Denied';
      message = "You don't have permission to access this page.";
    } else if (error.status === 500) {
      title = 'Server Error';
      message = 'An internal server error occurred. Please try again later.';
    } else {
      message = error.data?.message || error.data || message;
    }
  } else if (error instanceof Error) {
    // JavaScript errors
    title = error.name || 'Error';
    message = error.message;
    stackTrace = error.stack;
  } else if (typeof error === 'string') {
    message = error;
  }

  const handleGoHome = () => {
    navigate('/');
  };

  const handleReload = () => {
    window.location.reload();
  };

  const showDetails = import.meta.env.DEV && stackTrace;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-destructive/10 rounded-full mb-4">
            <AlertCircleIcon className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-center text-2xl">
            {statusCode && (
              <span className="text-muted-foreground font-mono mr-2">
                {statusCode}
              </span>
            )}
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {message}
          </p>

          {showDetails && (
            <details className="mt-6 p-4 bg-muted rounded-lg">
              <summary className="cursor-pointer font-medium text-sm mb-3 hover:text-primary">
                Error Details (Development Only)
              </summary>
              <div className="space-y-2">
                {error instanceof Error && (
                  <div className="text-xs">
                    <div className="font-semibold mb-1">Message:</div>
                    <div className="text-muted-foreground mb-3">{error.message}</div>
                  </div>
                )}
                {stackTrace && (
                  <div className="text-xs">
                    <div className="font-semibold mb-1">Stack Trace:</div>
                    <pre className="text-muted-foreground bg-background p-3 rounded border overflow-x-auto">
                      {stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleGoHome}
            className="gap-2"
          >
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Button>
          <Button
            onClick={handleReload}
            className="gap-2"
          >
            <RefreshCwIcon className="h-4 w-4" />
            Reload Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RouteErrorBoundary;

