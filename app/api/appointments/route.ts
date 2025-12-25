import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { AppointmentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET appointments (filtered by user role)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const barberId = searchParams.get('barberId');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {};

    // Filter based on user role
    if (session.user.role === 'CLIENT') {
      where.clientId = session.user.id;
    } else if (session.user.role === 'BARBER' && session.user.barberId) {
      where.barberId = session.user.barberId;
    }
    // ADMIN sees all

    // Handle special "upcoming" status
    if (status === 'upcoming') {
      where.status = { in: ['PENDING', 'CONFIRMED'] };
      where.date = { gte: new Date() };
    } else if (status) {
      where.status = status as AppointmentStatus;
    }

    if (barberId) {
      where.barberId = barberId;
    }

    // Get limit from query params if provided
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const appointments = await prisma.appointment.findMany({
      where,
      ...(limit && { take: limit }),
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
        barber: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        service: true,
        review: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Error al obtener citas' }, { status: 500 });
  }
}

// POST create a new appointment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { barberId, serviceId, date, time, paymentMethod, paymentReference, notes } = body;

    if (!barberId || !serviceId || !date || !time) {
      return NextResponse.json(
        { error: 'Barbero, servicio, fecha y hora son requeridos' },
        { status: 400 }
      );
    }

    // Check for conflicting appointments
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        barberId,
        date: new Date(date),
        time,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { error: 'Este horario ya está reservado' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        clientId: session.user.id,
        barberId,
        serviceId,
        date: new Date(date),
        time,
        paymentMethod: paymentMethod || null,
        paymentReference: paymentReference || null,
        notes: notes || null,
        status: AppointmentStatus.PENDING,
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

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Error al crear cita' }, { status: 500 });
  }
}
