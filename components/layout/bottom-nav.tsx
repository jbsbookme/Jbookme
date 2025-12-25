'use client';

import { Home, Sparkles, Plus, User, Menu, Bot } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/lib/i18n/i18n-context';

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  const { t } = useI18n();

  // Solo ocultar en páginas de auth y dashboards de admin/barbero
  if (pathname?.startsWith('/login') || 
      pathname?.startsWith('/registro') ||
      pathname?.startsWith('/auth') ||
      pathname?.startsWith('/dashboard/admin') ||
      pathname?.startsWith('/dashboard/barbero')) {
    return null;
  }

  const navItems = [
    {
      name: t('common.home'),
      icon: Home,
      href: session ? '/feed' : '/',
      active: pathname === '/feed' || pathname === '/',
      isCreate: false
    },
    {
      name: t('common.explore'),
      icon: Sparkles,
      href: '/galeria',
      active: pathname === '/galeria',
      isCreate: false
    },
    {
      name: 'AI',
      icon: Bot,
      href: '/asistente',
      active: pathname === '/asistente',
      isCreate: false,
      isAI: true
    },
    {
      name: t('common.post'),
      icon: Plus,
      href: session ? '/dashboard/cliente/publicar' : '/login',
      active: pathname === '/dashboard/cliente/publicar',
      isCreate: true
    },
    {
      name: t('common.profile'),
      icon: User,
      href: session ? '/dashboard/cliente' : '/login',
      active: pathname === '/dashboard/cliente',
      isCreate: false
    },
    {
      name: t('common.menu'),
      icon: Menu,
      href: '/menu',
      active: pathname === '/menu',
      isCreate: false
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-gray-800 pb-safe">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            
            // Special styling for AI assistant button
            if (item.isAI) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00f0ff] via-[#0099ff] to-[#0066ff] flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#00f0ff]/50">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </Link>
              );
            }
            
            // Special styling for create button
            if (item.isCreate && session) {
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-pink-500/50">
                    <Icon className="w-7 h-7 text-white" strokeWidth={3} />
                  </div>
                </Link>
              );
            }
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full group"
              >
                <div className={`flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'
                }`}>
                  <Icon
                    className={`w-6 h-6 mb-1 transition-colors duration-200 ${
                      isActive 
                        ? 'text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]' 
                        : 'text-gray-400 group-hover:text-[#ffd700]'
                    }`}
                  />
                  <span className={`text-xs font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-[#00f0ff]' 
                      : 'text-gray-400 group-hover:text-[#ffd700]'
                  }`}>
                    {item.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}