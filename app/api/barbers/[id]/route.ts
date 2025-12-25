import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET single barber by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const barberId = params.id;

    const barber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
          },
        },
        services: {
          where: { isActive: true },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            appointments: true,
          },
        },
      },
    });

    if (!barber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }

    // Calculate average rating
    const totalRating = barber.reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = barber.reviews.length > 0 ? totalRating / barber.reviews.length : 0;

    const barberWithRating = {
      ...barber,
      avgRating: Number(avgRating.toFixed(1)),
      totalReviews: barber._count.reviews,
      totalAppointments: barber._count.appointments,
    };

    return NextResponse.json({ barber: barberWithRating });
  } catch (error) {
    console.error('Error fetching barber:', error);
    return NextResponse.json({ error: 'Error al obtener barbero' }, { status: 500 });
  }
}

// PUT update barber (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const barberId = params.id;
    const body = await request.json();
    const { 
      name, 
      bio, 
      specialties, 
      hourlyRate, 
      profileImage, 
      isActive, 
      contactEmail, 
      gender,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      tiktokUrl,
      youtubeUrl,
      whatsappUrl,
      zelleEmail,
      zellePhone,
      cashappTag
    } = body;

    // Check if barber exists
    const existingBarber = await prisma.barber.findUnique({
      where: { id: barberId },
      include: { user: true },
    });

    if (!existingBarber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }

    // Update user name if provided
    if (name !== undefined && name !== existingBarber.user.name) {
      await prisma.user.update({
        where: { id: existingBarber.userId },
        data: { name },
      });
    }

    // Update barber
    const updatedBarber = await prisma.barber.update({
      where: { id: barberId },
      data: {
        bio: bio !== undefined ? bio : existingBarber.bio,
        specialties: specialties !== undefined ? specialties : existingBarber.specialties,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : existingBarber.hourlyRate,
        profileImage: profileImage !== undefined ? profileImage : existingBarber.profileImage,
        isActive: isActive !== undefined ? isActive : existingBarber.isActive,
        contactEmail: contactEmail !== undefined ? contactEmail : existingBarber.contactEmail,
        gender: gender !== undefined ? gender : existingBarber.gender,
        facebookUrl: facebookUrl !== undefined ? facebookUrl : existingBarber.facebookUrl,
        instagramUrl: instagramUrl !== undefined ? instagramUrl : existingBarber.instagramUrl,
        twitterUrl: twitterUrl !== undefined ? twitterUrl : existingBarber.twitterUrl,
        tiktokUrl: tiktokUrl !== undefined ? tiktokUrl : existingBarber.tiktokUrl,
        youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : existingBarber.youtubeUrl,
        whatsappUrl: whatsappUrl !== undefined ? whatsappUrl : existingBarber.whatsappUrl,
        zelleEmail: zelleEmail !== undefined ? zelleEmail : existingBarber.zelleEmail,
        zellePhone: zellePhone !== undefined ? zellePhone : existingBarber.zellePhone,
        cashappTag: cashappTag !== undefined ? cashappTag : existingBarber.cashappTag,
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ barber: updatedBarber });
  } catch (error) {
    console.error('Error updating barber:', error);
    return NextResponse.json({ error: 'Error al actualizar barbero' }, { status: 500 });
  }
}

// DELETE barber (admin only) - soft delete by setting isActive to false
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const barberId = params.id;

    // Check if barber exists
    const existingBarber = await prisma.barber.findUnique({
      where: { id: barberId },
    });

    if (!existingBarber) {
      return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    const deletedBarber = await prisma.barber.update({
      where: { id: barberId },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ 
      message: 'Barbero desactivado exitosamente',
      barber: deletedBarber 
    });
  } catch (error) {
    console.error('Error deleting barber:', error);
    return NextResponse.json({ error: 'Error al desactivar barbero' }, { status: 500 });
  }
}
