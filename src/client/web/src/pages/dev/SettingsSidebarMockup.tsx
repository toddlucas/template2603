import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, ChevronRight, Settings as SettingsIcon, Bot, Mail, Users, Bell, Plug } from "lucide-react";
import { cn } from "$/lib/utils";

/**
 * Settings Sidebar Mockup - Two-Level Navigation
 * 
 * This mockup demonstrates the proposed grouped settings sidebar structure
 * with expandable sections for better organization and scalability.
 * 
 * Navigate to: /dev/settings-sidebar-mockup
 */

interface SettingItem {
  id: string;
  label: string;
  path: string;
}

interface SettingGroup {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  items?: SettingItem[];
  defaultExpanded?: boolean;
}

const settingsStructure: SettingGroup[] = [
  {
    id: "general",
    label: "General",
    icon: SettingsIcon,
    path: "/settings/general",
  },
  {
    id: "ai",
    label: "AI & Research",
    icon: Bot,
    defaultExpanded: true,
    items: [
      { id: "ai-profile", label: "AI Profile", path: "/settings/ai" },
      { id: "ai-autonomy", label: "AI Autonomy", path: "/settings/ai-autonomy" },
      { id: "enrichment", label: "Data Enrichment", path: "/settings/enrichment" },
    ],
  },
  {
    id: "email",
    label: "Email",
    icon: Mail,
    defaultExpanded: true,
    items: [
      { id: "email-accounts", label: "Accounts", path: "/settings/email-accounts" },
      { id: "email-sending", label: "Sending Windows & Limits", path: "/settings/email/sending" },
      { id: "email-tracking", label: "Tracking Preferences", path: "/settings/email/tracking" },
    ],
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Users,
    items: [
      { id: "tags", label: "Tags", path: "/settings/tags" },
      { id: "custom-fields", label: "Custom Fields", path: "/settings/contacts/fields" },
    ],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/settings/notifications",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Plug,
    items: [
      { id: "hubspot", label: "HubSpot", path: "/settings/integrations/hubspot" },
      { id: "salesforce", label: "Salesforce", path: "/settings/integrations/salesforce" },
      { id: "webhooks", label: "Webhooks", path: "/settings/integrations/webhooks" },
    ],
  },
];

export function SettingsSidebarMockup() {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(settingsStructure.filter(g => g.defaultExpanded).map(g => g.id))
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Mockup Header - mimics actual settings header */}
      <div className="border-b bg-card/50">
        <div className="container mx-auto px-8 py-6">
          <div className="mb-4">
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-2">
              ← Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Mockup: Two-level sidebar navigation with expandable groups
          </p>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="container mx-auto px-8 py-8">
        <div className="flex gap-8">
          {/* Settings Sidebar - This is what we're demoing */}
          <aside className="w-[280px] shrink-0">
            <div className="border rounded-lg p-4 bg-card sticky top-8">

            <nav className="space-y-1">
              {settingsStructure.map((group) => {
                const Icon = group.icon;
                const isExpanded = expandedGroups.has(group.id);
                const hasItems = group.items && group.items.length > 0;

                return (
                  <div key={group.id}>
                    {/* Group Header */}
                    {hasItems ? (
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "text-left font-medium"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="flex-1">{group.label}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        )}
                      </button>
                    ) : (
                      <Link
                        to={group.path!}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isActive(group.path!) && "bg-accent text-accent-foreground font-medium"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{group.label}</span>
                      </Link>
                    )}

                    {/* Expandable Items */}
                    {hasItems && isExpanded && (
                      <div className="ml-6 mt-1 space-y-1 border-l-2 border-border pl-4">
                        {group.items!.map((item) => (
                          <Link
                            key={item.id}
                            to={item.path}
                            className={cn(
                              "block px-3 py-2 text-sm rounded-md transition-colors",
                              "hover:bg-accent hover:text-accent-foreground",
                              isActive(item.path) && "bg-accent text-accent-foreground font-medium"
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
            </div>
          </aside>

          {/* Settings Content Panel - This would be the actual settings page */}
          <main className="flex-1 min-w-0 space-y-6">
            {/* Example Settings Panel (simulates actual settings content) */}
            <div className="border rounded-lg p-6 bg-card">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">AI Profile</h2>
                <p className="text-muted-foreground">
                  Configure how AI represents you in communications
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Communication Style</label>
                  <select className="w-full p-2 border rounded-md bg-background">
                    <option>Professional</option>
                    <option>Casual</option>
                    <option>Formal</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Choose how AI should communicate on your behalf
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Signature</label>
                  <textarea 
                    className="w-full p-3 border rounded-md bg-background min-h-[100px]" 
                    placeholder="Best regards,&#10;Your Name"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <div className="font-medium">Use AI for drafting</div>
                    <div className="text-sm text-muted-foreground">
                      Allow AI to generate email drafts
                    </div>
                  </div>
                  <div className="h-6 w-11 rounded-full bg-primary" />
                </div>

                <div className="pt-4 border-t">
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="border rounded-lg p-6 bg-muted/50">
              <h3 className="text-xl font-semibold mb-4">About This Mockup</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This demonstrates the complete <strong>Settings Layout</strong>: The sidebar (left) would appear alongside actual settings content panels (like the AI Profile example above).
              </p>
              <h4 className="font-semibold mb-3 mt-6">Key Features:</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">Expandable Groups</div>
                    <div className="text-muted-foreground">
                      Click on "AI & Research", "Email", "Contacts", or "Integrations" to expand/collapse
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">Visual Hierarchy</div>
                    <div className="text-muted-foreground">
                      Nested items are indented with a connecting line for clear parent-child relationship
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">Active State</div>
                    <div className="text-muted-foreground">
                      Currently selected item is highlighted (simulated in mockup)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">Icons for Context</div>
                    <div className="text-muted-foreground">
                      Each top-level group has a recognizable icon
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <div className="font-medium">Scalable Design</div>
                    <div className="text-muted-foreground">
                      Easy to add more groups and items without clutter
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-semibold mb-4">Current Structure</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    AI & Research (3 items)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• AI Profile - Configure AI behavior and tone</li>
                    <li>• AI Autonomy - Set AI decision-making permissions</li>
                    <li>• Data Enrichment - Configure enrichment providers</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email (3 items)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Accounts - Connect email accounts (Office 365, Gmail, etc.)</li>
                    <li>• Sending Windows & Limits - Configure when and how many emails to send</li>
                    <li>• Tracking Preferences - Open/click tracking settings</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Contacts (2 items)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• Tags - Manage contact tags (colors, names, merging)</li>
                    <li>• Custom Fields - Define custom contact properties (P1)</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Plug className="h-4 w-4" />
                    Integrations (3 items - Post-MVP)
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    <li>• HubSpot - Sync contacts and activities</li>
                    <li>• Salesforce - CRM integration</li>
                    <li>• Webhooks - Custom integration events</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-semibold mb-4">Comparison with Current</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-amber-600 dark:text-amber-400">Current (Flat List)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 border rounded bg-muted/50">General</div>
                    <div className="p-2 border rounded bg-muted/50">AI Profile</div>
                    <div className="p-2 border rounded bg-muted/50">AI Autonomy</div>
                    <div className="p-2 border rounded bg-muted/50">Data Enrichment</div>
                    <div className="p-2 border rounded bg-muted/50">Email Accounts</div>
                    <div className="p-2 border rounded bg-muted/50">Tags</div>
                    <div className="p-2 border rounded bg-muted/50">Notifications</div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    ❌ Long list, no grouping<br />
                    ❌ Hard to scan<br />
                    ❌ Doesn't scale well
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3 text-green-600 dark:text-green-400">Proposed (Grouped)</h4>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 border rounded bg-muted/50">General</div>
                    <div className="p-2 border rounded bg-primary/10 font-medium">AI & Research ›</div>
                    <div className="p-2 border rounded bg-muted/50 ml-4 text-xs">↳ 3 items</div>
                    <div className="p-2 border rounded bg-primary/10 font-medium">Email ›</div>
                    <div className="p-2 border rounded bg-muted/50 ml-4 text-xs">↳ 3 items</div>
                    <div className="p-2 border rounded bg-primary/10 font-medium">Contacts ›</div>
                    <div className="p-2 border rounded bg-muted/50 ml-4 text-xs">↳ 2 items</div>
                    <div className="p-2 border rounded bg-muted/50">Notifications</div>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    ✅ Organized by category<br />
                    ✅ Easy to scan<br />
                    ✅ Scales with growth
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

