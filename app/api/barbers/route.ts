export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET all active barbers with their ratings
export async function GET() {
  try {
    const barbers = await prisma.barber.findMany({
      where: { isActive: true },
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate average rating for each barber
    const barbersWithRatings = barbers.map((barber) => {
      const totalRating = barber.reviews.reduce((sum, review) => sum + review.rating, 0);
      const avgRating = barber.reviews.length > 0 ? totalRating / barber.reviews.length : 0;

      return {
        ...barber,
        avgRating: Number(avgRating.toFixed(1)),
        totalReviews: barber._count.reviews,
        totalAppointments: barber._count.appointments,
      };
    });

    return NextResponse.json({ barbers: barbersWithRatings });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 });
  }
}

// POST create a new barber (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      name, 
      email,
      password, 
      bio, 
      specialties, 
      hourlyRate, 
      profileImage,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      tiktokUrl,
      youtubeUrl,
      whatsappUrl,
      contactEmail,
      gender,
      zelleEmail,
      zellePhone,
      cashappTag
    } = body;

    // If userId is provided, use existing user
    if (userId) {
      const barber = await prisma.barber.create({
        data: {
          userId,
          bio: bio || null,
          specialties: specialties || null,
          hourlyRate: hourlyRate || null,
          profileImage: profileImage || null,
          facebookUrl: facebookUrl || null,
          instagramUrl: instagramUrl || null,
          twitterUrl: twitterUrl || null,
          tiktokUrl: tiktokUrl || null,
          youtubeUrl: youtubeUrl || null,
          whatsappUrl: whatsappUrl || null,
          contactEmail: contactEmail || null,
          gender: gender || 'BOTH',
          zelleEmail: zelleEmail || null,
          zellePhone: zellePhone || null,
          cashappTag: cashappTag || null,
        },
        include: {
          user: true,
        },
      });

      return NextResponse.json({ barber }, { status: 201 });
    }

    // Otherwise, create a new user and barber together
    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'La contraseña es requerida' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Un usuario con este email ya existe' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and barber in a transaction
    const barber = await prisma.barber.create({
      data: {
        bio: bio || null,
        specialties: specialties || null,
        hourlyRate: hourlyRate || null,
        profileImage: profileImage || null,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        twitterUrl: twitterUrl || null,
        tiktokUrl: tiktokUrl || null,
        youtubeUrl: youtubeUrl || null,
        whatsappUrl: whatsappUrl || null,
        contactEmail: contactEmail || null,
        gender: gender || 'BOTH',
        zelleEmail: zelleEmail || null,
        zellePhone: zellePhone || null,
        cashappTag: cashappTag || null,
        user: {
          create: {
            name,
            email,
            password: hashedPassword,
            role: 'BARBER',
          },
        },
      },
      include: {
        user: true,
      },
    });

    return NextResponse.json({ barber }, { status: 201 });
  } catch (error) {
    console.error('Error creating barber:', error);
    return NextResponse.json({ error: 'Error al crear barbero' }, { status: 500 });
  }
}
