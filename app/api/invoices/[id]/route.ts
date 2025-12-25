export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

// GET /api/invoices/[id] - Obtener una factura específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        barberPayment: {
          include: {
            barber: {
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        appointment: {
          include: {
            service: true,
            client: {
              select: {
                name: true,
                email: true,
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
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Factura no encontrada' },
        { status: 404 }
      );
    }

    // Verificar permisos: debe ser el destinatario o admin
    if (
      invoice.recipientId !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Error al obtener la factura' },
      { status: 500 }
    );
  }
}

// PATCH /api/invoices/[id] - Actualizar estado de factura
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden actualizar facturas' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isPaid, paidAt } = body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        isPaid: isPaid !== undefined ? isPaid : undefined,
        paidAt: isPaid && !paidAt ? new Date() : paidAt ? new Date(paidAt) : undefined,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la factura' },
      { status: 500 }
    );
  }
}
