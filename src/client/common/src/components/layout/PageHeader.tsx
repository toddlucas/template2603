import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
  search?: {
    placeholder: string;
    onChange: (value: string) => void;
  };
  actions?: ReactNode;
}

const PageHeader = ({ title, description, search, actions }: PageHeaderProps) => {
  return (
    <div className="bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            </div>
            {(search || actions) && (
              <div className="flex items-center gap-4">
                {search && (
                  <input
                    type="text"
                    placeholder={search.placeholder}
                    className="px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    onChange={(e) => search.onChange(e.target.value)}
                  />
                )}
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;

