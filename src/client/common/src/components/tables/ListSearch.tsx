import { useState } from 'react';

interface ListSearchProps {
  onSearch: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

const ListSearch = ({ onSearch, placeholder = "Search...", className = "" }: ListSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex">
        <div className="relative flex-1 min-w-0">
          <input
            className="block w-full px-3 py-2 text-sm text-on-surface bg-surface border border-standard rounded-l-md focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-colors duration-200"
            type="text"
            name="search"
            placeholder={placeholder}
            aria-label={placeholder}
            aria-describedby="search-submit"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-on-primary bg-primary border border-primary rounded-r-md hover:bg-primary-hover hover:border-primary-hover focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 focus:outline-none transition-colors duration-200"
          type="submit"
          id="search-submit"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
        </button>
      </form>
    </div>
  );
};

export default ListSearch;
