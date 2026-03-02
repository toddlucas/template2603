import { useTranslation } from 'react-i18next';

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  options?: number[];
}

const PageSizeSelector = ({
  pageSize,
  onPageSizeChange,
  options = [5, 10, 25, 50, 100]
}: PageSizeSelectorProps) => {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-secondary font-medium">Show:</span>
      <select
        id="pageSize"
        className="px-3 py-1.5 text-sm text-on-surface bg-surface border border-standard rounded-md focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-colors duration-200"
        style={{ width: 'auto' }}
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="text-muted">{t("per page")}</span>
    </div>
  );
};

export default PageSizeSelector;
