export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { format, parse, addMinutes } from 'date-fns';
import { DayOfWeek } from '@prisma/client';

// GET /api/availability - Get available time slots for a barber on a specific date
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barberId = searchParams.get('barberId');
    const date = searchParams.get('date');

    if (!barberId || !date) {
      return NextResponse.json(
        { error: 'barberId y date son requeridos' },
        { status: 400 }
      );
    }

    // Parse the date and get day of week (0 = Sunday, 6 = Saturday)
    const selectedDate = parse(date, 'yyyy-MM-dd', new Date());
    const dayOfWeekNum = selectedDate.getDay();
    
    // Convert JavaScript day (0=Sunday) to DayOfWeek enum
    const dayMapping: Record<number, DayOfWeek> = {
      0: DayOfWeek.SUNDAY,
      1: DayOfWeek.MONDAY,
      2: DayOfWeek.TUESDAY,
      3: DayOfWeek.WEDNESDAY,
      4: DayOfWeek.THURSDAY,
      5: DayOfWeek.FRIDAY,
      6: DayOfWeek.SATURDAY,
    };
    
    const dayOfWeek = dayMapping[dayOfWeekNum];

    // Get barber's availability for this day of week
    const availability = await prisma.availability.findFirst({
      where: {
        barberId: barberId,
        dayOfWeek: dayOfWeek,
        isAvailable: true,
      },
    });

    if (!availability) {
      return NextResponse.json({ availableTimes: [] });
    }

    // Get existing appointments for this barber on this date
    // Create date range for the entire day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        barberId: barberId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        service: true,
      },
    });

    // Generate all possible time slots
    const startTime = parse(availability.startTime, 'HH:mm', new Date());
    const endTime = parse(availability.endTime, 'HH:mm', new Date());
    const timeSlots: string[] = [];
    
    let currentTime = startTime;
    while (currentTime < endTime) {
      timeSlots.push(format(currentTime, 'HH:mm'));
      currentTime = addMinutes(currentTime, 30); // 30 minute slots
    }

    // Filter out booked slots
    const bookedTimes = existingAppointments.map(apt => apt.time);
    const availableTimes = timeSlots.filter(time => !bookedTimes.includes(time));

    return NextResponse.json({ availableTimes });
  } catch (error) {
    console.error('Error fetching available times:', error);
    return NextResponse.json(
      { error: 'Error al obtener horarios disponibles' },
      { status: 500 }
    );
  }
}
