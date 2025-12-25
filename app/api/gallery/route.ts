export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db'
import { getFileUrl } from '@/lib/s3'

// GET: Obtener todas las imágenes de galería activas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const gender = searchParams.get('gender')
    const tag = searchParams.get('tag')

    const whereClause: any = includeInactive ? {} : { isActive: true }
    
    if (gender) {
      whereClause.gender = gender
    }
    
    if (tag) {
      whereClause.tags = {
        has: tag
      }
    }

    const images = await prisma.galleryImage.findMany({
      where: whereClause,
      include: {
        barber: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    // Generar URLs para las imágenes
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => {
        const imageUrl = await getFileUrl(image.cloud_storage_path, image.isPublic)
        return {
          ...image,
          imageUrl
        }
      })
    )

    return NextResponse.json(imagesWithUrls)
  } catch (error) {
    console.error('Error fetching gallery images:', error)
    return NextResponse.json(
      { error: 'Error al obtener las imágenes' },
      { status: 500 }
    )
  }
}

// POST: Crear nueva imagen de galería
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cloud_storage_path, title, description, order } = body

    if (!cloud_storage_path || !title) {
      return NextResponse.json(
        { error: 'cloud_storage_path y title son requeridos' },
        { status: 400 }
      )
    }

    const image = await prisma.galleryImage.create({
      data: {
        cloud_storage_path,
        title,
        description: description || null,
        order: order || 0,
        isPublic: true,
        isActive: true
      }
    })

    const imageUrl = await getFileUrl(image.cloud_storage_path, image.isPublic)

    return NextResponse.json({
      ...image,
      imageUrl
    })
  } catch (error) {
    console.error('Error creating gallery image:', error)
    return NextResponse.json(
      { error: 'Error al crear la imagen' },
      { status: 500 }
    )
  }
}
