'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { NotificationsBell } from '@/components/notifications-bell';
import { LanguageSelector } from '@/components/language-selector';
import { useI18n } from '@/lib/i18n/i18n-context';

export function DashboardNavbar() {
  const { data: session } = useSession() || {};
  const { t } = useI18n();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0a0a0a]/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden">
            <Image 
              src="/logo.png" 
              alt="BookMe Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold">
            <span className="text-[#00f0ff]">Book</span>
            <span className="text-[#ffd700]">Me</span>
          </span>
        </Link>

        <div className="flex items-center space-x-3 md:space-x-4">
          <NotificationsBell />
          <LanguageSelector />
          <div className="hidden sm:flex items-center space-x-2 text-gray-300">
            <User className="w-5 h-5" />
            <span className="text-sm">{session?.user?.name || 'User'}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="border-gray-700 text-white hover:bg-red-500/20 hover:border-red-500 hover:text-red-500"
          >
            <LogOut className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />
            <span className="hidden md:inline">{t('common.logout')}</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}