import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
// We'll use a simple native select for robustness if complex dropdowns aren't available, but let's try to make it look good.
// Since I don't see a DropdownMenu component in the file list earlier (it showed card, button, input, label),
// I will build a custom accessible dropdown using details/summary or just a styled relative div or native select.
// Native select is safest for now to ensure it works without adding more shadcn components that might be missing.
// However, the requirement "Display flag icon to the LEFT" suggests custom UI because native select options don't support images/icons well in all browsers.

const LANGUAGES = [
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' }, // or generic Arabic flag
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'pl', label: 'Polski', flag: '🇵🇱' },
    { code: 'ro', label: 'Română', flag: '🇷🇴' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
    { code: 'sq', label: 'Shqip', flag: '🇦🇱' },
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'uk', label: 'Українська', flag: '🇺🇦' },
];

export function LanguageSelector() {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.language-selector')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES.find(l => l.code === 'de');

    const handleLanguageChange = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
        // Persist to local storage if needed, but detector handles it usually.
        // Also need to handle user profile sync if logged in (Layout/App responsibility).
    };

    return (
        <div className="relative language-selector">
            <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 px-2"
                onClick={() => setIsOpen(!isOpen)}
                title={t('layout.language_selector.label')}
            >
                <span className="text-lg leading-none">{currentLang?.flag}</span>
                <span className="hidden lg:inline-block">{currentLang?.label}</span>
                <ChevronDown className={cn("h-4 w-4 transition-transform opacity-50", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50 animate-in fade-in-0 zoom-in-95">
                    <div className="max-h-[300px] overflow-y-auto">
                        {LANGUAGES.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={cn(
                                    "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                                    i18n.language === lang.code && "bg-accent text-accent-foreground"
                                )}
                            >
                                <span className="mr-2 text-lg leading-none">{lang.flag}</span>
                                <span className="flex-1 text-left">{lang.label}</span>
                                {i18n.language === lang.code && (
                                    <Check className="h-4 w-4 ml-auto" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
