import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Shield,
  Link2,
  Trash2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "$/components/ui/card";
import { Button } from "$/components/ui/button";

interface AccountCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  variant?: "default" | "destructive";
}

const accountCards: AccountCard[] = [
  {
    title: "Personal Information",
    description: "View and manage your personal data",
    icon: User,
    path: "/account/personal-data",
  },
  {
    title: "Email Address",
    description: "Change your email address",
    icon: Mail,
    path: "/account/email",
  },
  {
    title: "Password",
    description: "Update your password",
    icon: Lock,
    path: "/account/change-password",
  },
  {
    title: "Two-Factor Authentication",
    description: "Secure your account with 2FA",
    icon: Shield,
    path: "/account/two-factor-authentication",
  },
  {
    title: "Connected Accounts",
    description: "Manage OAuth and external logins",
    icon: Link2,
    path: "/account/external-logins",
  },
  {
    title: "Download My Data",
    description: "Export your personal data",
    icon: Download,
    path: "/account/download-personal-data",
  },
  {
    title: "Delete Account",
    description: "Permanently delete your account and data",
    icon: Trash2,
    path: "/account/delete-personal-data",
    variant: "destructive",
  },
];

export default function AccountProfilePage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Back navigation */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Account Settings</h1>
        <p className="text-lg text-muted-foreground">
          Manage your account information, security, and privacy settings
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accountCards.map((card) => {
          const Icon = card.icon;
          const isDestructive = card.variant === "destructive";

          return (
            <Link key={card.path} to={card.path}>
              <Card
                className={`h-full transition-all hover:shadow-md hover:scale-[1.02] ${
                  isDestructive ? "border-destructive/50 hover:border-destructive" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        isDestructive
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className={isDestructive ? "text-destructive" : ""}>
                        {card.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Additional info section */}
      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h2 className="text-sm font-semibold mb-2">Need help?</h2>
        <p className="text-sm text-muted-foreground">
          If you have questions about your account settings or need assistance, please{" "}
          <a href="#" className="text-primary hover:underline">
            contact support
          </a>
          .
        </p>
      </div>
    </div>
  );
}

