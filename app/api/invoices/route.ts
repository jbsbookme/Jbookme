import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

// GET /api/invoices - Obtener facturas
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const userId = searchParams.get('userId') || session.user.id;

    // Solo admin puede ver facturas de otros usuarios
    if (userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    let whereClause: any = {};

    // Si es admin, mostrar TODAS las facturas (con o sin recipientId)
    // Si no es admin, solo mostrar sus propias facturas
    if (session.user.role !== 'ADMIN') {
      whereClause.recipientId = userId;
    }

    if (type) {
      whereClause.type = type;
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
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
      orderBy: {
        issueDate: 'desc',
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Error al obtener las facturas' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Crear una factura
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear facturas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      barberPaymentId,
      appointmentId,
      recipientId,
      recipientName,
      recipientEmail,
      amount,
      description,
      items,
      dueDate,
    } = body;

    // Validar campos requeridos
    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validate recipient information
    if (!recipientId && (!recipientName || !recipientEmail)) {
      return NextResponse.json(
        { error: 'Se requiere recipientId o recipientName/recipientEmail' },
        { status: 400 }
      );
    }

    // Obtener información del destinatario
    let recipient: any = null;
    let actualRecipientId = recipientId;
    let actualRecipientName = recipientName;
    let actualRecipientEmail = recipientEmail;
    let actualRecipientPhone = '';

    if (recipientId) {
      recipient = await prisma.user.findUnique({
        where: { id: recipientId },
      });

      if (!recipient) {
        return NextResponse.json(
          { error: 'Destinatario no encontrado' },
          { status: 404 }
        );
      }

      actualRecipientName = recipient.name || 'Sin nombre';
      actualRecipientEmail = recipient.email;
      actualRecipientPhone = recipient.phone || '';
    } else {
      // For invoices without recipientId, we'll use null but store name/email
      actualRecipientId = null;
    }

    // Obtener configuración de la barbería
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      // Crear settings por defecto si no existe
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

    // Validate and process items
    let processedItems = null;
    if (items && Array.isArray(items) && items.length > 0) {
      // Ensure items have required fields
      const validItems = items.filter((item: any) => 
        item.description && 
        typeof item.quantity === 'number' && item.quantity > 0 &&
        typeof item.price === 'number' && item.price >= 0
      );
      
      if (validItems.length === 0) {
        return NextResponse.json(
          { error: 'Los ítems deben tener descripción, cantidad y precio válidos' },
          { status: 400 }
        );
      }
      
      processedItems = validItems;
    }

    // Crear la factura
    const invoiceData: any = {
      invoiceNumber,
      type,
      barberPaymentId: barberPaymentId || null,
      appointmentId: appointmentId || null,
      issuerName: settings.shopName,
      issuerAddress: settings.address || '',
      issuerPhone: settings.phone || '',
      issuerEmail: settings.email || '',
      recipientName: actualRecipientName || 'Sin nombre',
      recipientEmail: actualRecipientEmail,
      recipientPhone: actualRecipientPhone,
      amount,
      description: description || 'Factura sin descripción',
      items: processedItems,
      dueDate: dueDate ? new Date(dueDate) : null,
      isPaid: false,
    };

    // Only add recipientId if it exists
    if (actualRecipientId) {
      invoiceData.recipientId = actualRecipientId;
    }

    // Build include object conditionally
    const includeConfig: any = {};
    if (actualRecipientId) {
      includeConfig.recipient = {
        select: {
          id: true,
          name: true,
          email: true,
        },
      };
    }

    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: includeConfig,
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Error al crear la factura' },
      { status: 500 }
    );
  }
}
