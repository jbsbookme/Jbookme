import { useState, useEffect } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = () => {
      const supported =
        typeof window !== 'undefined' &&
        'Notification' in window &&
        'serviceWorker' in navigator &&
        'PushManager' in window;
      
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  useEffect(() => {
    // Listen for foreground messages
    if (messaging && isSubscribed) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        if (payload.notification) {
          toast(payload.notification.title || 'Notificación', {
            description: payload.notification.body,
          });
        }
      });

      return () => unsubscribe();
    }
  }, [isSubscribed]);

  const subscribe = async () => {
    if (!isSupported) {
      toast.error('Las notificaciones no están soportadas en este dispositivo');
      return;
    }

    setIsLoading(true);

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast.error('Se necesita permiso para enviar notificaciones');
        return;
      }

      // Get FCM token
      if (!messaging) {
        throw new Error('Messaging no está disponible');
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!token) {
        throw new Error('No se pudo obtener el token de FCM');
      }

      // Save subscription to backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          endpoint: token, // Using FCM token as endpoint
          keys: {
            p256dh: token, // Placeholder for FCM
            auth: token, // Placeholder for FCM
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar la suscripción');
      }

      setIsSubscribed(true);
      toast.success('¡Notificaciones activadas!');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Error al activar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);

    try {
      if (!messaging) {
        throw new Error('Messaging no está disponible');
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      // Remove subscription from backend
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: token,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la suscripción');
      }

      setIsSubscribed(false);
      toast.success('Notificaciones desactivadas');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Error al desactivar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
  };
}
