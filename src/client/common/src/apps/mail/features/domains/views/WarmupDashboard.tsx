import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$/components/ui/card';

const WarmupDashboard: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Email Warmup</CardTitle>
          <CardDescription>
            Monitor and manage your domain warmup progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Warmup dashboard coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarmupDashboard;
