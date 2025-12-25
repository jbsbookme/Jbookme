'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface AddToCalendarButtonProps {
  appointmentId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  appointmentData?: {
    date: string;
    time: string;
    service: { name: string; duration: number };
    barber: { name: string; email?: string };
    client: { name: string; email?: string };
  };
}

export function AddToCalendarButton({
  appointmentId,
  variant = 'outline',
  size = 'sm',
  showText = true,
  appointmentData,
}: AddToCalendarButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Open in Google Calendar
  const handleGoogleCalendar = async () => {
    setIsLoading(true);
    try {
      // If we have appointment data, generate URL directly
      if (appointmentData) {
        const { openInGoogleCalendar } = await import('@/lib/calendar');
        openInGoogleCalendar({
          id: appointmentId,
          ...appointmentData,
        });
        toast.success('¡Abriendo Google Calendar!');
      } else {
        // Otherwise, fetch appointment data first
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (!response.ok) {
          throw new Error('Error al obtener datos de la cita');
        }
        const appointment = await response.json();
        
        const { openInGoogleCalendar } = await import('@/lib/calendar');
        openInGoogleCalendar({
          id: appointmentId,
          date: appointment.date,
          time: appointment.time,
          service: {
            name: appointment.service.name,
            duration: appointment.service.duration,
          },
          barber: {
            name: appointment.barber.name,
            email: appointment.barber.user?.email,
          },
          client: {
            name: appointment.user.name,
            email: appointment.user.email,
          },
        });
        toast.success('¡Abriendo Google Calendar!');
      }
    } catch (error) {
      console.error('Error opening Google Calendar:', error);
      toast.error('Error al abrir Google Calendar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={showText ? "gap-2" : "h-7 w-7 p-0"}
      disabled={isLoading}
      onClick={handleGoogleCalendar}
    >
      <svg
        className="h-3.5 w-3.5"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm5.959 14.588c-.12 3.517-2.998 6.353-6.515 6.353-3.59 0-6.5-2.91-6.5-6.5s2.91-6.5 6.5-6.5c1.696 0 3.232.638 4.406 1.685l-1.787 1.724c-.49-.47-1.322-1.02-2.619-1.02-2.241 0-4.065 1.857-4.065 4.111s1.824 4.111 4.065 4.111c2.075 0 3.195-1.287 3.502-3.089h-3.502v-2.263h5.834c.057.303.09.616.09.963z" />
      </svg>
      {showText && (
        <span className="hidden sm:inline">Google Calendar</span>
      )}
    </Button>
  );
}
