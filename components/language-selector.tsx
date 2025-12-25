'use client';

import { useI18n } from '@/lib/i18n/i18n-context';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-400 hover:text-[#00f0ff] transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">
            {language === 'en' ? 'English' : 'Español'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-gray-800">
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className={
            language === 'en'
              ? 'bg-[#00f0ff]/10 text-[#00f0ff] cursor-pointer'
              : 'text-gray-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/5 cursor-pointer'
          }
        >
          <span className="mr-2">🇺🇸</span> English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('es')}
          className={
            language === 'es'
              ? 'bg-[#00f0ff]/10 text-[#00f0ff] cursor-pointer'
              : 'text-gray-400 hover:text-[#00f0ff] hover:bg-[#00f0ff]/5 cursor-pointer'
          }
        >
          <span className="mr-2">🇪🇸</span> Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
