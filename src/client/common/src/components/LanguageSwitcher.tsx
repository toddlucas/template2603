import { LanguagesIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { cn } from "$/utility/utils";

export interface Language {
  code: string;
  label: string;
}

export interface LanguageSwitcherProps {
  languages: Language[];
  className?: string;
  triggerClassName?: string;
}

export function LanguageSwitcher({
  languages,
  className,
  triggerClassName,
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || "en";

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem("I18N_LANGUAGE", languageCode);
  };

  const currentLanguageLabel =
    languages.find((lang) => lang.code === currentLanguage)?.label ||
    currentLanguage.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2", triggerClassName)}
          aria-label="Change language"
        >
          <LanguagesIcon className="size-4" />
          <span className="hidden sm:inline">{currentLanguageLabel}</span>
          <span className="sm:hidden">{currentLanguage.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={className}>
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={cn(
              "cursor-pointer",
              currentLanguage === language.code && "bg-accent"
            )}
          >
            {language.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

