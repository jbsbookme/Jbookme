import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

// GET /api/barber/availability - Get barber's availability schedule
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'BARBER') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los barberos pueden ver su disponibilidad.' },
        { status: 401 }
      );
    }

    // Find the barber record
    const barber = await prisma.barber.findUnique({
      where: { userId: session.user.id },
      include: {
        availability: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Perfil de barbero no encontrado.' },
        { status: 404 }
      );
    }

    return NextResponse.json(barber.availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Error al obtener la disponibilidad.' },
      { status: 500 }
    );
  }
}

// PUT /api/barber/availability - Update barber's availability schedule
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'BARBER') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los barberos pueden actualizar su disponibilidad.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { availability } = body;

    if (!availability || !Array.isArray(availability)) {
      return NextResponse.json(
        { error: 'Datos de disponibilidad inválidos.' },
        { status: 400 }
      );
    }

    // Find the barber record
    const barber = await prisma.barber.findUnique({
      where: { userId: session.user.id },
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Perfil de barbero no encontrado.' },
        { status: 404 }
      );
    }

    // Update availability for each day
    const updatePromises = availability.map(async (day: any) => {
      return prisma.availability.upsert({
        where: {
          barberId_dayOfWeek: {
            barberId: barber.id,
            dayOfWeek: day.dayOfWeek,
          },
        },
        update: {
          startTime: day.startTime,
          endTime: day.endTime,
          isAvailable: day.isAvailable,
        },
        create: {
          barberId: barber.id,
          dayOfWeek: day.dayOfWeek,
          startTime: day.startTime,
          endTime: day.endTime,
          isAvailable: day.isAvailable,
        },
      });
    });

    await Promise.all(updatePromises);

    // Fetch updated availability
    const updatedAvailability = await prisma.availability.findMany({
      where: { barberId: barber.id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({
      message: 'Disponibilidad actualizada exitosamente.',
      availability: updatedAvailability,
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la disponibilidad.' },
      { status: 500 }
    );
  }
}
