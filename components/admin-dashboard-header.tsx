'use client';

import { PushNotificationButton } from './push-notification-button';
import { Button } from './ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function AdminDashboardHeader() {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
      <div>
        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">
          Panel de <span className="text-[#00f0ff]">Administración</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base">Vista general del sistema</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/inbox">
          <Button variant="outline" className="border-gray-700 hover:border-[#00f0ff] hover:text-[#00f0ff] h-9 text-sm">
            <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Mensajes</span>
          </Button>
        </Link>
        <PushNotificationButton />
      </div>
    </div>
  );
}
