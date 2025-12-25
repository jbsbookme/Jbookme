export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { PaymentStatus } from '@prisma/client';

// GET - List all barber payments (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get('barberId');
    const status = searchParams.get('status') as PaymentStatus | null;

    const payments = await prisma.barberPayment.findMany({
      where: {
        ...(barberId && { barberId }),
        ...(status && { status }),
      },
      include: {
        barber: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        weekStart: 'desc',
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching barber payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch barber payments' },
      { status: 500 }
    );
  }
}

// POST - Create a new barber payment (Admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { barberId, amount, weekStart, weekEnd, status, notes } = body;

    if (!barberId || !amount || !weekStart || !weekEnd) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const payment = await prisma.barberPayment.create({
      data: {
        barberId,
        amount: parseFloat(amount),
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        status: status || PaymentStatus.PENDING,
        notes,
        paidAt: status === PaymentStatus.PAID ? new Date() : null,
      },
      include: {
        barber: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    // Crear factura automáticamente
    try {
      // Obtener configuración de la barbería
      let settings = await prisma.settings.findFirst();
      if (!settings) {
        settings = await prisma.settings.create({
          data: {
            shopName: 'BookMe',
            address: '',
            phone: '',
            email: '',
          },
        });
      }

      // Generar número de factura único
      const currentYear = new Date().getFullYear();
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: {
            startsWith: `INV-${currentYear}-`,
          },
        },
        orderBy: {
          invoiceNumber: 'desc',
        },
      });

      let nextNumber = 1;
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      const invoiceNumber = `INV-${currentYear}-${String(nextNumber).padStart(4, '0')}`;

      // Crear la factura
      await prisma.invoice.create({
        data: {
          invoiceNumber,
          type: 'BARBER_PAYMENT',
          barberPaymentId: payment.id,
          issuerName: settings.shopName,
          issuerAddress: settings.address || '',
          issuerPhone: settings.phone || '',
          issuerEmail: settings.email || '',
          recipientId: payment.barber.userId,
          recipientName: payment.barber.user.name || 'Sin nombre',
          recipientEmail: payment.barber.user.email,
          recipientPhone: payment.barber.user.phone || '',
          amount: parseFloat(amount),
          description: `Pago semanal - Del ${new Date(weekStart).toLocaleDateString('es-ES')} al ${new Date(weekEnd).toLocaleDateString('es-ES')}`,
          dueDate: new Date(weekEnd),
          isPaid: status === PaymentStatus.PAID,
          paidAt: status === PaymentStatus.PAID ? new Date() : null,
        },
      });
    } catch (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      // No fallar la creación del pago si falla la factura
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error creating barber payment:', error);
    return NextResponse.json(
      { error: 'Failed to create barber payment' },
      { status: 500 }
    );
  }
}
