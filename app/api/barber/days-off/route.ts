export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

// GET /api/barber/days-off - Get barber's days off
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'BARBER') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los barberos pueden ver sus días libres.' },
        { status: 401 }
      );
    }

    // Find the barber record
    const barber = await prisma.barber.findUnique({
      where: { userId: session.user.id },
      include: {
        daysOff: {
          where: {
            date: {
              gte: new Date(), // Only future days off
            },
          },
          orderBy: {
            date: 'asc',
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

    return NextResponse.json(barber.daysOff);
  } catch (error) {
    console.error('Error fetching days off:', error);
    return NextResponse.json(
      { error: 'Error al obtener los días libres.' },
      { status: 500 }
    );
  }
}

// POST /api/barber/days-off - Create a new day off
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'BARBER') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los barberos pueden agregar días libres.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { date, reason } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'La fecha es requerida.' },
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

    // Check if day off already exists
    const existingDayOff = await prisma.dayOff.findUnique({
      where: {
        barberId_date: {
          barberId: barber.id,
          date: new Date(date),
        },
      },
    });

    if (existingDayOff) {
      return NextResponse.json(
        { error: 'Ya existe un día libre registrado para esta fecha.' },
        { status: 409 }
      );
    }

    // Create day off
    const dayOff = await prisma.dayOff.create({
      data: {
        barberId: barber.id,
        date: new Date(date),
        reason: reason || null,
      },
    });

    return NextResponse.json(
      {
        message: 'Día libre agregado exitosamente.',
        dayOff,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating day off:', error);
    return NextResponse.json(
      { error: 'Error al agregar el día libre.' },
      { status: 500 }
    );
  }
}

// DELETE /api/barber/days-off?id=xxx - Delete a day off
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'BARBER') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los barberos pueden eliminar días libres.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const dayOffId = searchParams.get('id');

    if (!dayOffId) {
      return NextResponse.json(
        { error: 'ID del día libre es requerido.' },
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

    // Verify the day off belongs to this barber
    const dayOff = await prisma.dayOff.findUnique({
      where: { id: dayOffId },
    });

    if (!dayOff) {
      return NextResponse.json(
        { error: 'Día libre no encontrado.' },
        { status: 404 }
      );
    }

    if (dayOff.barberId !== barber.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar este día libre.' },
        { status: 403 }
      );
    }

    // Delete the day off
    await prisma.dayOff.delete({
      where: { id: dayOffId },
    });

    return NextResponse.json({
      message: 'Día libre eliminado exitosamente.',
    });
  } catch (error) {
    console.error('Error deleting day off:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el día libre.' },
      { status: 500 }
    );
  }
}
