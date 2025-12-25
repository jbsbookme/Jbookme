export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

// GET /api/invoice-items - Obtener ítems predefinidos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden ver ítems' },
        { status: 403 }
      );
    }

    const items = await prisma.invoiceItemTemplate.findMany({
      orderBy: {
        description: 'asc',
      },
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { error: 'Error al obtener los ítems' },
      { status: 500 }
    );
  }
}

// POST /api/invoice-items - Crear ítem predefinido
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden crear ítems' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { description, price } = body;

    // Validación
    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'La descripción es requerida' },
        { status: 400 }
      );
    }

    if (!price || price <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const item = await prisma.invoiceItemTemplate.create({
      data: {
        description: description.trim(),
        price: parseFloat(price),
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice item:', error);
    return NextResponse.json(
      { error: 'Error al crear el ítem' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoice-items?id=xxx - Eliminar ítem predefinido
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo administradores pueden eliminar ítems' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    await prisma.invoiceItemTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice item:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el ítem' },
      { status: 500 }
    );
  }
}
