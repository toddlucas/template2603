interface SearchInputProps {
  placeholder?: string;
  onChange: (value: string) => void;
}

const SearchInput = ({
  placeholder = 'Search...',
  onChange
}: SearchInputProps) => {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default SearchInput;

