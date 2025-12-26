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
  const { data: session } = useSession();
  const { t } = useI18n();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-black/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/dashboard/cliente" className="flex items-center space-x-3">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg">
            <Image
              src="/logo.png"
              alt="JBookMe Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-bold">
            <span className="text-cyan-400">J</span>
            <span className="text-cyan-400">Book</span>
            <span className="text-yellow-400">Me</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <LanguageSelector />

          <div className="hidden sm:flex items-center gap-2 text-gray-300">
            <User className="h-4 w-4" />
            <span className="text-sm">
              {session?.user?.name || t('common.hello')}
            </span>
          </div>

          <Button
            onClick={handleLogout}
            size="sm"
            className="
              bg-red-600 text-white
              hover:bg-red-700
              active:bg-red-800
            "
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </div>
    </nav>
  );
}