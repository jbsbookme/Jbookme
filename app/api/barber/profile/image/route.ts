export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile, getFileUrl } from '@/lib/s3';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'BARBER') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'El archivo debe ser una imagen' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'La imagen no debe superar los 10MB' },
        { status: 400 }
      );
    }

    // Convertir a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const fileName = `barber-profile-${session.user.id}-${timestamp}.${ext}`;

    // Subir a S3 (público)
    const cloud_storage_path = await uploadFile(buffer, fileName, true);

    // Obtener URL público
    const imageUrl = await getFileUrl(cloud_storage_path, true);

    // Buscar el registro del barbero
    const barber = await prisma.barber.findFirst({
      where: { userId: session.user.id }
    });

    if (!barber) {
      return NextResponse.json(
        { error: 'Perfil de barbero no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar la foto de perfil del barbero
    await prisma.barber.update({
      where: { id: barber.id },
      data: { profileImage: imageUrl }
    });

    return NextResponse.json(
      { 
        imageUrl,
        message: 'Foto de perfil actualizada correctamente'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error uploading barber profile image:', error);
    return NextResponse.json(
      { error: 'Error al subir la imagen' },
      { status: 500 }
    );
  }
}