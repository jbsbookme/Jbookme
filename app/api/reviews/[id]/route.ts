export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';


// GET single review
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
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
    });

    if (!review) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Error al obtener reseña' }, { status: 500 });
  }
}

// PATCH update review (admin response)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only admin can respond to reviews
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo el administrador puede responder reseñas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { adminResponse } = body;

    if (!adminResponse || typeof adminResponse !== 'string') {
      return NextResponse.json(
        { error: 'La respuesta es requerida' },
        { status: 400 }
      );
    }

    // Check if review exists
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        adminResponse,
        adminRespondedAt: new Date(),
      },
      include: {
        client: {
          select: {
            name: true,
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
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Error al actualizar reseña' }, { status: 500 });
  }
}

// DELETE remove admin response
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Only admin can delete responses
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo el administrador puede eliminar respuestas' },
        { status: 403 }
      );
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Reseña no encontrada' }, { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        adminResponse: null,
        adminRespondedAt: null,
      },
    });

    return NextResponse.json({ review: updatedReview });
  } catch (error) {
    console.error('Error deleting response:', error);
    return NextResponse.json({ error: 'Error al eliminar respuesta' }, { status: 500 });
  }
}
