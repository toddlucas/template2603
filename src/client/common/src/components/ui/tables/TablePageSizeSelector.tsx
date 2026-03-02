import React from 'react';
import { useTranslation } from 'react-i18next';

interface TablePageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  options?: number[];
}

const TablePageSizeSelector: React.FC<TablePageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  options = [5, 10, 25, 50, 100]
}) => {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-muted-foreground font-medium">{t("Show")}:</span>
      <select
        id="pageSize"
        className="px-3 py-1.5 text-sm text-foreground bg-background border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-ring focus:outline-none transition-colors duration-200"
        style={{ width: 'auto' }}
        value={pageSize}
        onChange={(e) => onPageSizeChange(Number(e.target.value))}
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span className="text-muted-foreground">{t("per page")}</span>
    </div>
  );
};

export default TablePageSizeSelector;
