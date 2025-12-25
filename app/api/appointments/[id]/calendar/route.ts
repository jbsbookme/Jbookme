import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { generateAppointmentICS } from '@/lib/calendar';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const appointmentId = params.id;

    // Fetch appointment with all related data
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        service: true,
        barber: {
          include: {
            user: true,
          },
        },
        client: true,
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    // Verify user has access to this appointment
    const isClient = appointment.clientId === session.user.id;
    const isBarber = appointment.barber?.userId === session.user.id;
    const isAdmin = session.user.role === 'ADMIN';

    if (!isClient && !isBarber && !isAdmin) {
      return NextResponse.json({ error: 'No tienes acceso a esta cita' }, { status: 403 });
    }

    // Generate ICS content
    const icsContent = generateAppointmentICS({
      id: appointment.id,
      date: appointment.date.toISOString(),
      time: appointment.time,
      service: {
        name: appointment.service?.name || 'Servicio',
        duration: appointment.service?.duration || 60,
      },
      barber: {
        name: appointment.barber?.user?.name || 'Barbero',
        email: appointment.barber?.user?.email,
      },
      client: {
        name: appointment.client?.name || 'Cliente',
        email: appointment.client?.email,
      },
      location: 'BookMe Barbería',
    });

    // Return as downloadable file
    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="bookme-cita-${appointment.id}.ics"`,
      },
    });
  } catch (error) {
    console.error('Error generating calendar file:', error);
    return NextResponse.json(
      { error: 'Error al generar archivo de calendario' },
      { status: 500 }
    );
  }
}
