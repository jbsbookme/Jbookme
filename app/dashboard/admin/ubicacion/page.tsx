'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Save, ArrowLeft, Navigation } from 'lucide-react'

interface Settings {
  id: string
  shopName: string
  address: string | null
  phone: string | null
  email: string | null
  latitude: number | null
  longitude: number | null
}

export default function GestionUbicacionPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: ''
  })

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    if (status === 'authenticated') {
      fetchSettings()
    }
  }, [status, session, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        setFormData({
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || ''
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Error al cargar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: settings?.shopName || 'Mi Barbería',
          address: formData.address || null,
          phone: formData.phone || null,
          email: formData.email || null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null
        })
      })

      if (response.ok) {
        toast.success('Ubicación actualizada exitosamente')
        fetchSettings()
      } else {
        toast.error('Error al actualizar la ubicación')
      }
    } catch (error) {
      console.error('Error updating location:', error)
      toast.error('Error al actualizar la ubicación')
    } finally {
      setSaving(false)
    }
  }

  const openInMaps = () => {
    if (formData.latitude && formData.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${formData.latitude},${formData.longitude}`
      window.open(url, '_blank')
    } else if (formData.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.address)}`
      window.open(url, '_blank')
    } else {
      toast.error('Ingresa una dirección o coordenadas primero')
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-cyan-400">Cargando...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/admin')}
              className="text-gray-400 hover:text-cyan-400 hover:bg-transparent"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Ubicación</h1>
              <p className="text-gray-400">Configura la dirección y ubicación del negocio</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-500" />
                Información de Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Dirección</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Ej: 123 Calle Principal, Ciudad, CP 12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Ej: +1 (555) 123-4567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Ej: info@mibarberia.com"
                  />
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="text-white font-semibold mb-3">Coordenadas GPS (Opcional)</h3>
                  <p className="text-sm text-gray-400 mb-3">
                    Puedes obtener las coordenadas buscando tu dirección en Google Maps
                  </p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="latitude" className="text-white">Latitud</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="40.7128"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="longitude" className="text-white">Longitud</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white"
                        placeholder="-74.0060"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold h-10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openInMaps}
                    className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 h-10 whitespace-nowrap"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Ver en Mapa
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Preview Map */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Vista Previa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {formData.latitude && formData.longitude ? (
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${formData.latitude},${formData.longitude}&zoom=15`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MapPin className="w-12 h-12 mb-4" />
                    <p className="text-center">
                      Ingresa coordenadas GPS<br />para ver el mapa
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <h4 className="text-white font-semibold">Información Actual</h4>
                {formData.address && (
                  <p className="text-sm text-gray-400">
                    <span className="text-cyan-500">Dirección:</span> {formData.address}
                  </p>
                )}
                {formData.phone && (
                  <p className="text-sm text-gray-400">
                    <span className="text-cyan-500">Teléfono:</span> {formData.phone}
                  </p>
                )}
                {formData.email && (
                  <p className="text-sm text-gray-400">
                    <span className="text-cyan-500">Email:</span> {formData.email}
                  </p>
                )}
                {formData.latitude && formData.longitude && (
                  <p className="text-sm text-gray-400">
                    <span className="text-cyan-500">Coordenadas:</span> {formData.latitude}, {formData.longitude}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-900/20 border-blue-800">
          <CardContent className="p-4">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Cómo obtener coordenadas GPS
            </h3>
            <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
              <li>Ve a <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">Google Maps</a></li>
              <li>Busca tu dirección exacta</li>
              <li>Haz clic derecho en el marcador rojo</li>
              <li>Selecciona la primera opción (las coordenadas)</li>
              <li>Las coordenadas se copiarán al portapapeles</li>
              <li>Pégalas aquí (formato: latitud, longitud)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
