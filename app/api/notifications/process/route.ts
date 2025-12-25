export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  sendEmail,
  generate24HourReminderEmail,
  generate12HourReminderEmail,
  generate2HourReminderEmail,
  generate30MinuteReminderEmail,
  generateThankYouEmail,
} from '@/lib/email';
import { AppointmentStatus } from '@prisma/client';
import webpush from 'web-push';


// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.NEXT_PUBLIC_APP_URL || 'mailto:admin@bookme.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

/**
 * Send push notification to a user
 */
async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            badge: '/icon-96.png',
            data: data || {},
          })
        );
      } catch (error: any) {
        // If subscription is invalid, delete it
        if (error.statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        console.error('Error sending push to subscription:', error);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error sending push notifications:', error);
  }
}

/**
 * Process and send appointment notifications
 * This endpoint checks for appointments that need notifications and sends them
 */
export async function POST() {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in12Hours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000);

    let sentCount = 0;

    // ===== 24-HOUR REMINDERS =====
    // Find appointments that are 24 hours away and haven't been notified yet
    const appointments24h = await prisma.appointment.findMany({
      where: {
        date: {
          gte: in24Hours,
          lte: new Date(in24Hours.getTime() + 60 * 60 * 1000), // Within 1-hour window
        },
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
        },
        notification24hSent: false,
      },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    for (const appointment of appointments24h) {
      const clientEmail = appointment.client?.email;
      const barberEmail = appointment.barber?.user?.email;
      const clientName = appointment.client?.name || 'Cliente';
      const barberName = appointment.barber?.user?.name || 'Barbero';
      const serviceName = appointment.service?.name || 'Servicio';
      const date = new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = appointment.time;

      // Send to client
      if (clientEmail) {
        const emailBody = generate24HourReminderEmail(
          clientName,
          barberName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: clientEmail,
          subject: '⏰ Recordatorio: Tu cita es mañana',
          body: emailBody,
        });
        
        // Send push notification to client
        if (appointment.clientId) {
          await sendPushNotification(
            appointment.clientId,
            '⏰ Recordatorio de Cita',
            `Tu cita con ${barberName} es mañana a las ${time}`,
            { appointmentId: appointment.id }
          );
        }
        
        sentCount++;
      }

      // Send to barber
      if (barberEmail) {
        const emailBody = generate24HourReminderEmail(
          barberName,
          clientName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: barberEmail,
          subject: '⏰ Recordatorio: Cita programada mañana',
          body: emailBody,
        });
        
        // Send push notification to barber
        if (appointment.barberId) {
          const barberUserId = appointment.barber?.userId;
          if (barberUserId) {
            await sendPushNotification(
              barberUserId,
              '⏰ Recordatorio de Cita',
              `Cita con ${clientName} mañana a las ${time}`,
              { appointmentId: appointment.id }
            );
          }
        }
        
        sentCount++;
      }

      // Mark as sent
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { notification24hSent: true },
      });
    }

    // ===== 12-HOUR REMINDERS =====
    // Find appointments that are 12 hours away and haven't been notified yet
    const appointments12h = await prisma.appointment.findMany({
      where: {
        date: {
          gte: in12Hours,
          lte: new Date(in12Hours.getTime() + 60 * 60 * 1000), // Within 1-hour window
        },
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
        },
        notification12hSent: false,
      },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    for (const appointment of appointments12h) {
      const clientEmail = appointment.client?.email;
      const barberEmail = appointment.barber?.user?.email;
      const clientName = appointment.client?.name || 'Cliente';
      const barberName = appointment.barber?.user?.name || 'Barbero';
      const serviceName = appointment.service?.name || 'Servicio';
      const date = new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = appointment.time;

      // Send to client
      if (clientEmail) {
        const emailBody = generate12HourReminderEmail(
          clientName,
          barberName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: clientEmail,
          subject: '⏰ Tu cita es en 12 horas',
          body: emailBody,
        });
        
        // Send push notification to client
        if (appointment.clientId) {
          await sendPushNotification(
            appointment.clientId,
            '⏰ Recordatorio de Cita',
            `Tu cita con ${barberName} es en 12 horas (${time})`,
            { appointmentId: appointment.id }
          );
        }
        
        sentCount++;
      }

      // Send to barber
      if (barberEmail) {
        const emailBody = generate12HourReminderEmail(
          barberName,
          clientName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: barberEmail,
          subject: '⏰ Cita en 12 horas',
          body: emailBody,
        });
        
        // Send push notification to barber
        if (appointment.barberId) {
          const barberUserId = appointment.barber?.userId;
          if (barberUserId) {
            await sendPushNotification(
              barberUserId,
              '⏰ Recordatorio de Cita',
              `Cita con ${clientName} en 12 horas (${time})`,
              { appointmentId: appointment.id }
            );
          }
        }
        
        sentCount++;
      }

      // Mark as sent
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { notification12hSent: true },
      });
    }

    // ===== 2-HOUR REMINDERS =====
    // Find appointments that are 2 hours away and haven't been notified yet
    const appointments2h = await prisma.appointment.findMany({
      where: {
        date: {
          gte: in2Hours,
          lte: new Date(in2Hours.getTime() + 30 * 60 * 1000), // Within 30-minute window
        },
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
        },
        notification2hSent: false,
      },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    for (const appointment of appointments2h) {
      const clientEmail = appointment.client?.email;
      const barberEmail = appointment.barber?.user?.email;
      const clientName = appointment.client?.name || 'Cliente';
      const barberName = appointment.barber?.user?.name || 'Barbero';
      const serviceName = appointment.service?.name || 'Servicio';
      const date = new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = appointment.time;

      // Send to client
      if (clientEmail) {
        const emailBody = generate2HourReminderEmail(
          clientName,
          barberName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: clientEmail,
          subject: '⏰ ¡Tu cita es en 2 horas!',
          body: emailBody,
        });
        
        // Send push notification to client
        if (appointment.clientId) {
          await sendPushNotification(
            appointment.clientId,
            '⏰ ¡Cita Próxima!',
            `Tu cita con ${barberName} es en 2 horas (${time})`,
            { appointmentId: appointment.id }
          );
        }
        
        sentCount++;
      }

      // Send to barber
      if (barberEmail) {
        const emailBody = generate2HourReminderEmail(
          barberName,
          clientName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: barberEmail,
          subject: '⏰ Cita en 2 horas',
          body: emailBody,
        });
        
        // Send push notification to barber
        if (appointment.barberId) {
          const barberUserId = appointment.barber?.userId;
          if (barberUserId) {
            await sendPushNotification(
              barberUserId,
              '⏰ Cita Próxima',
              `Cita con ${clientName} en 2 horas (${time})`,
              { appointmentId: appointment.id }
            );
          }
        }
        
        sentCount++;
      }

      // Mark as sent
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { notification2hSent: true },
      });
    }

    // ===== 30-MINUTE REMINDERS =====
    // Find appointments that are 30 minutes away and haven't been notified yet
    const appointments30m = await prisma.appointment.findMany({
      where: {
        date: {
          gte: in30Minutes,
          lte: new Date(in30Minutes.getTime() + 15 * 60 * 1000), // Within 15-minute window
        },
        status: {
          in: [AppointmentStatus.CONFIRMED, AppointmentStatus.PENDING],
        },
        notification30mSent: false,
      },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    for (const appointment of appointments30m) {
      const clientEmail = appointment.client?.email;
      const barberEmail = appointment.barber?.user?.email;
      const clientName = appointment.client?.name || 'Cliente';
      const barberName = appointment.barber?.user?.name || 'Barbero';
      const serviceName = appointment.service?.name || 'Servicio';
      const date = new Date(appointment.date).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const time = appointment.time;

      // Send to client
      if (clientEmail) {
        const emailBody = generate30MinuteReminderEmail(
          clientName,
          barberName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: clientEmail,
          subject: '🚨 ¡URGENTE! Tu cita es en 30 minutos',
          body: emailBody,
        });
        
        // Send push notification to client
        if (appointment.clientId) {
          await sendPushNotification(
            appointment.clientId,
            '🚨 ¡URGENTE! Cita en 30 Minutos',
            `Tu cita con ${barberName} es AHORA a las ${time}. ¡No llegues tarde!`,
            { appointmentId: appointment.id, urgent: true }
          );
        }
        
        sentCount++;
      }

      // Send to barber
      if (barberEmail) {
        const emailBody = generate30MinuteReminderEmail(
          barberName,
          clientName,
          serviceName,
          date,
          time
        );
        await sendEmail({
          to: barberEmail,
          subject: '🚨 Cita en 30 minutos',
          body: emailBody,
        });
        
        // Send push notification to barber
        if (appointment.barberId) {
          const barberUserId = appointment.barber?.userId;
          if (barberUserId) {
            await sendPushNotification(
              barberUserId,
              '🚨 Cita Inminente',
              `Cita con ${clientName} en 30 minutos (${time})`,
              { appointmentId: appointment.id, urgent: true }
            );
          }
        }
        
        sentCount++;
      }

      // Mark as sent
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { notification30mSent: true },
      });
    }

    // ===== THANK YOU MESSAGES =====
    // Find completed appointments from today that haven't received thank you
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const completedAppointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: now,
        },
        status: AppointmentStatus.COMPLETED,
        thankYouSent: false,
      },
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    for (const appointment of completedAppointments) {
      const clientEmail = appointment.client?.email;
      const clientName = appointment.client?.name || 'Cliente';
      const barberName = appointment.barber?.user?.name || 'Barbero';
      const serviceName = appointment.service?.name || 'Servicio';

      if (clientEmail) {
        const emailBody = generateThankYouEmail(clientName, barberName, serviceName);
        await sendEmail({
          to: clientEmail,
          subject: '💈 ¡Gracias por tu visita!',
          body: emailBody,
        });
        sentCount++;

        // Mark as sent
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: { thankYouSent: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Procesadas exitosamente ${sentCount} notificaciones`,
      details: {
        reminders24h: appointments24h.length,
        reminders12h: appointments12h.length,
        reminders2h: appointments2h.length,
        reminders30m: appointments30m.length,
        thankYou: completedAppointments.length,
      },
    });
  } catch (error) {
    console.error('Error processing notifications:', error);
    return NextResponse.json(
      { error: 'Error al procesar notificaciones' },
      { status: 500 }
    );
  }
}
