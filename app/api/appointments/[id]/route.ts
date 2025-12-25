import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { AppointmentStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

type Params = {
  params: Promise<{ id: string }>;
};

// Helper function to validate 24-hour cancellation policy
function canCancelAppointment(appointmentDate: Date, appointmentTime: string): boolean {
  // Parse the appointment date and time
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  const appointmentDateTime = new Date(appointmentDate);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  // Calculate the difference in hours
  const now = new Date();
  const hoursDifference = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursDifference >= 24;
}

// PATCH update appointment
export async function PATCH(request: NextRequest, context: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // If status is being changed to CANCELLED, enforce 24-hour policy
    if (body.status === AppointmentStatus.CANCELLED || body.status === 'CANCELLED') {
      const appointment = await prisma.appointment.findUnique({
        where: { id },
      });

      if (!appointment) {
        return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
      }

      // Admins can cancel anytime
      if (session.user.role !== 'ADMIN') {
        if (!canCancelAppointment(appointment.date, appointment.time)) {
          return NextResponse.json(
            {
              error:
                'No se puede cancelar la cita. Debe cancelarse con al menos 24 horas de anticipación.',
            },
            { status: 400 }
          );
        }
      }

      // Add cancellation timestamp and reason
      body.cancelledAt = new Date();
      if (!body.cancellationReason) {
        body.cancellationReason = 'Cancelado por el usuario';
      }
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: body,
      include: {
        client: true,
        barber: {
          include: {
            user: true,
          },
        },
        service: true,
      },
    });

    // Si la cita se marca como completada, crear factura automáticamente
    if (body.status === AppointmentStatus.COMPLETED || body.status === 'COMPLETED') {
      try {
        // Verificar si ya existe una factura para esta cita
        const existingInvoice = await prisma.invoice.findFirst({
          where: { appointmentId: id },
        });

        if (!existingInvoice) {
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
              type: 'CLIENT_SERVICE',
              appointmentId: id,
              issuerName: settings.shopName,
              issuerAddress: settings.address || '',
              issuerPhone: settings.phone || '',
              issuerEmail: settings.email || '',
              recipientId: updatedAppointment.clientId,
              recipientName: updatedAppointment.client.name || 'Sin nombre',
              recipientEmail: updatedAppointment.client.email,
              recipientPhone: updatedAppointment.client.phone || '',
              amount: updatedAppointment.service.price,
              description: `Servicio: ${updatedAppointment.service.name} - Barbero: ${updatedAppointment.barber.user.name}`,
              items: [
                {
                  description: updatedAppointment.service.name,
                  quantity: 1,
                  unitPrice: updatedAppointment.service.price,
                  total: updatedAppointment.service.price,
                },
              ],
              isPaid: true,
              paidAt: new Date(),
            },
          });
        }
      } catch (invoiceError) {
        console.error('Error creating invoice for completed appointment:', invoiceError);
        // No fallar la actualización de la cita si falla la factura
      }
    }

    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Error al actualizar cita' }, { status: 500 });
  }
}

// DELETE cancel appointment (enforces 24-hour policy)
export async function DELETE(request: NextRequest, context: Params) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await context.params;

    // Get the appointment first to check the 24-hour policy
    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }

    // Admins can cancel anytime
    if (session.user.role !== 'ADMIN') {
      if (!canCancelAppointment(appointment.date, appointment.time)) {
        return NextResponse.json(
          {
            error:
              'No se puede cancelar la cita. Debe cancelarse con al menos 24 horas de anticipación.',
          },
          { status: 400 }
        );
      }
    }

    // Soft delete - mark as cancelled instead of deleting
    await prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: 'Cancelado por el usuario',
      },
    });

    return NextResponse.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: 'Error al cancelar cita' }, { status: 500 });
  }
}
