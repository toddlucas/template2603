import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$/components/ui/card';

const DomainList: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Mail Domains</CardTitle>
          <CardDescription>
            Manage your sending domains and their authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Domain management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DomainList;
