export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

// POST - Registrar pago manual
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get barber info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { barber: true },
    });

    if (!user?.barber) {
      return NextResponse.json({ error: 'Solo barberos pueden registrar pagos manuales' }, { status: 403 });
    }

    const body = await request.json();
    const { amount, paymentMethod, description, clientName, date } = body;

    // Validar campos requeridos
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 });
    }

    // Crear pago manual
    const manualPayment = await prisma.manualPayment.create({
      data: {
        barberId: user.barber.id,
        amount: parseFloat(amount),
        paymentMethod,
        description: description || null,
        clientName: clientName || null,
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      payment: manualPayment 
    });
  } catch (error) {
    console.error('Error creating manual payment:', error);
    return NextResponse.json(
      { error: 'Error al registrar el pago manual' },
      { status: 500 }
    );
  }
}

// GET - Obtener pagos manuales del barbero
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get barber info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { barber: true },
    });

    if (!user?.barber) {
      return NextResponse.json({ error: 'Solo barberos pueden ver pagos manuales' }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // Obtener pagos manuales
    const payments = await prisma.manualPayment.findMany({
      where: {
        barberId: user.barber.id,
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching manual payments:', error);
    return NextResponse.json(
      { error: 'Error al obtener pagos manuales' },
      { status: 500 }
    );
  }
}
