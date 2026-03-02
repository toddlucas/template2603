import { AlertCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
import { Alert, AlertDescription } from "$/components/ui/alert";
import { Button } from "$/components/ui/button";

interface ComingSoonPageProps {
  featureName: string;
  description: string;
  releaseInfo?: string;
  backLink?: {
    to: string;
    label: string;
  };
}

export function ComingSoonPage({
  featureName,
  description,
  releaseInfo = "This feature is currently in development",
  backLink = { to: "/dashboard", label: "Back to Dashboard" },
}: ComingSoonPageProps) {
  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Back navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to={backLink.to}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLink.label}
          </Link>
        </Button>
      </div>

      {/* Main content */}
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{featureName}</h1>
          <p className="text-lg text-muted-foreground">{description}</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {releaseInfo}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Under Development</CardTitle>
            <CardDescription>
              This feature will be available in an upcoming release
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We're working hard to bring you this feature. Check back soon for updates,
              or contact support if you have questions about the roadmap.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

