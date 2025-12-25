import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { AppointmentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

// GET reviews
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const limit = searchParams.get('limit');

    const where = barberId ? { barberId } : {};

    const reviews = await prisma.review.findMany({
      where,
      take: limit ? parseInt(limit) : undefined,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        barber: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        appointment: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected format
    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment || '',
      createdAt: review.createdAt.toISOString(),
      adminResponse: review.adminResponse || null,
      adminRespondedAt: review.adminRespondedAt?.toISOString() || null,
      client: {
        name: review.client.name || 'Cliente',
        email: review.client.email || '',
        image: review.client.image || null
      },
      barber: {
        name: review.barber.user.name || 'Barbero'
      }
    }));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Error al obtener reseñas' }, { status: 500 });
  }
}

// POST create a review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { appointmentId, barberId, rating, comment } = body;

    if (!appointmentId || !barberId || !rating) {
      return NextResponse.json(
        { error: 'Cita, barbero y calificación son requeridos' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'La calificación debe estar entre 1 y 5' },
        { status: 400 }
      );
    }

    // Verify appointment belongs to user and is completed
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    if (appointment.clientId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      return NextResponse.json(
        { error: 'Solo puedes dejar reseñas de citas completadas' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { appointmentId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'Ya dejaste una reseña para esta cita' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        appointmentId,
        clientId: session.user.id,
        barberId,
        rating,
        comment: comment || null,
      },
      include: {
        client: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json({ error: 'Error al crear reseña' }, { status: 500 });
  }
}
