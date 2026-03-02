import React from 'react';

const AccessDenied: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
      <p className="text-lg">
        You do not have permission to access this resource.
      </p>
    </div>
  );
};

export default AccessDenied;
