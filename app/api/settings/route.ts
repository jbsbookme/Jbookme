import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET settings
export async function GET() {
  try {
    let settings = await prisma.settings.findFirst()

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          shopName: 'Mi Barbería',
          address: '123 Calle Principal, Ciudad',
          phone: '+1 (555) 123-4567',
          email: 'info@mibarberia.com',
          latitude: 40.7128,
          longitude: -74.0060
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT update settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { shopName, address, phone, email, latitude, longitude, facebook, instagram, twitter, tiktok, youtube, whatsapp } = body

    let settings = await prisma.settings.findFirst()

    if (!settings) {
      // Create if doesn't exist
      settings = await prisma.settings.create({
        data: {
          shopName: shopName || 'Mi Barbería',
          address,
          phone,
          email,
          latitude,
          longitude,
          facebook,
          instagram,
          twitter,
          tiktok,
          youtube,
          whatsapp
        }
      })
    } else {
      // Update existing
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: {
          shopName,
          address,
          phone,
          email,
          latitude,
          longitude,
          facebook,
          instagram,
          twitter,
          tiktok,
          youtube,
          whatsapp
        }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}
