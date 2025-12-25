'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, Upload, X, ArrowLeft, Image as ImageIcon, Tag } from 'lucide-react'

interface Barber {
  id: string
  user?: {
    name: string | null
  }
}

interface GalleryImage {
  id: string
  cloud_storage_path: string
  imageUrl: string
  title: string
  description: string | null
  tags: string[]
  gender: string | null
  barberId: string | null
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function GestionGaleriaPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null)
  const [genderFilter, setGenderFilter] = useState<string>('ALL')

  // Estados para nuevo registro
  const [newImage, setNewImage] = useState({
    title: '',
    description: '',
    tags: '',
    gender: 'UNISEX',
    barberId: '',
    order: 0,
    cloud_storage_path: ''
  })

  // Estados para subida de imagen
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadPreview, setUploadPreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cargar imágenes y barberos
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    if (status === 'authenticated') {
      fetchImages()
      fetchBarbers()
    }
  }, [status, session, router])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/gallery?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      toast.error('Error al cargar las imágenes')
    } finally {
      setLoading(false)
    }
  }

  const fetchBarbers = async () => {
    try {
      const response = await fetch('/api/barbers')
      if (response.ok) {
        const data = await response.json()
        setBarbers(data.barbers || [])
      }
    } catch (error) {
      console.error('Error fetching barbers:', error)
    }
  }

  // Manejo de subida de archivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona una imagen válida')
        return
      }
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setUploadedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      toast.error('Por favor arrastra una imagen válida')
    }
  }

  const handleImageUpload = async () => {
    if (!uploadedFile) {
      toast.error('Por favor selecciona una imagen')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/gallery/upload-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setNewImage(prev => ({ ...prev, cloud_storage_path: data.cloud_storage_path }))
        toast.success('Imagen subida exitosamente')
      } else {
        toast.error('Error al subir la imagen')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error al subir la imagen')
    } finally {
      setIsUploading(false)
    }
  }

  const removeUploadedImage = () => {
    setUploadedFile(null)
    setUploadPreview('')
    setNewImage(prev => ({ ...prev, cloud_storage_path: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Crear imagen
  const handleAddImage = async () => {
    if (!newImage.title.trim()) {
      toast.error('El título es requerido')
      return
    }

    if (!newImage.cloud_storage_path && !uploadedFile) {
      toast.error('Debes subir una imagen')
      return
    }

    try {
      // Si hay un archivo sin subir, subirlo primero
      if (uploadedFile && !newImage.cloud_storage_path) {
        await handleImageUpload()
        // Esperar un momento para que se complete la subida
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newImage,
          tags: newImage.tags ? newImage.tags.split(',').map(t => t.trim()).filter(t => t) : [],
          barberId: newImage.barberId || null
        })
      })

      if (response.ok) {
        toast.success('Imagen agregada exitosamente')
        setIsAddDialogOpen(false)
        setNewImage({ title: '', description: '', tags: '', gender: 'UNISEX', barberId: '', order: 0, cloud_storage_path: '' })
        removeUploadedImage()
        fetchImages()
      } else {
        toast.error('Error al agregar la imagen')
      }
    } catch (error) {
      console.error('Error adding image:', error)
      toast.error('Error al agregar la imagen')
    }
  }

  // Actualizar imagen
  const handleUpdateImage = async () => {
    if (!selectedImage) return

    try {
      const response = await fetch(`/api/gallery/${selectedImage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedImage.title,
          description: selectedImage.description,
          order: selectedImage.order,
          isActive: selectedImage.isActive
        })
      })

      if (response.ok) {
        toast.success('Imagen actualizada exitosamente')
        setIsEditDialogOpen(false)
        setSelectedImage(null)
        fetchImages()
      } else {
        toast.error('Error al actualizar la imagen')
      }
    } catch (error) {
      console.error('Error updating image:', error)
      toast.error('Error al actualizar la imagen')
    }
  }

  // Eliminar imagen
  const handleDeleteImage = async (id: string) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Imagen eliminada exitosamente')
        fetchImages()
      } else {
        toast.error('Error al eliminar la imagen')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      toast.error('Error al eliminar la imagen')
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
      <div className="max-w-7xl mx-auto">
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
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 truncate">
                <span className="bg-gradient-to-r from-[#00f0ff] to-purple-500 bg-clip-text text-transparent">
                  Gestión de Galería
                </span>
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">Administra las imágenes de la galería pública</p>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Imagen
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">Agregar Nueva Imagen</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {/* Subida de imagen */}
                <div className="space-y-2">
                  <Label className="text-white">Imagen *</Label>
                  {!uploadPreview ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-400 mb-2">Arrastra una imagen o haz clic para seleccionar</p>
                      <p className="text-sm text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden">
                        <Image
                          src={uploadPreview}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeUploadedImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      {!newImage.cloud_storage_path && (
                        <Button
                          onClick={handleImageUpload}
                          disabled={isUploading}
                          className="w-full mt-2"
                        >
                          {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Título *</Label>
                  <Input
                    id="title"
                    value={newImage.title}
                    onChange={(e) => setNewImage({ ...newImage, title: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Ej: Interior Moderno"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descripción</Label>
                  <Textarea
                    id="description"
                    value={newImage.description}
                    onChange={(e) => setNewImage({ ...newImage, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Descripción de la imagen"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-white flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Tags / Etiquetas
                  </Label>
                  <Input
                    id="tags"
                    value={newImage.tags}
                    onChange={(e) => setNewImage({ ...newImage, tags: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Ej: corte, fade, diseño (separados por coma)"
                  />
                  <p className="text-xs text-gray-400">Separa múltiples tags con coma</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-white">Categoría</Label>
                  <select
                    id="gender"
                    value={newImage.gender}
                    onChange={(e) => setNewImage({ ...newImage, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="MALE">Hombres</option>
                    <option value="FEMALE">Mujeres</option>
                    <option value="UNISEX">Unisex (Ambos)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barberId" className="text-white">Barbero (Opcional)</Label>
                  <select
                    id="barberId"
                    value={newImage.barberId}
                    onChange={(e) => setNewImage({ ...newImage, barberId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Sin asignar</option>
                    {barbers.map((barber) => (
                      <option key={barber.id} value={barber.id}>
                        {barber.user?.name || 'Barbero'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order" className="text-white">Orden</Label>
                  <Input
                    id="order"
                    type="number"
                    value={newImage.order}
                    onChange={(e) => setNewImage({ ...newImage, order: parseInt(e.target.value) || 0 })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => {
                  setIsAddDialogOpen(false)
                  setNewImage({ title: '', description: '', tags: '', gender: 'UNISEX', barberId: '', order: 0, cloud_storage_path: '' })
                  removeUploadedImage()
                }}>Cancelar</Button>
                <Button onClick={handleAddImage}>Agregar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter Section */}
        <div className="mb-6 flex items-center gap-4">
          <Label className="text-white font-semibold">Filter by Gender:</Label>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">All Photos</option>
            <option value="MALE">Men Only</option>
            <option value="FEMALE">Women Only</option>
            <option value="UNISEX">Unisex</option>
          </select>
          <span className="text-gray-400 text-sm">
            ({images.filter(img => genderFilter === 'ALL' || img.gender === genderFilter).length} photos)
          </span>
        </div>

        {/* Grid de imágenes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.filter(img => genderFilter === 'ALL' || img.gender === genderFilter).map((image) => (
            <Card key={image.id} className="bg-gray-900 border-gray-800 overflow-hidden">
              <div className="relative aspect-video bg-gray-800">
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  fill
                  className="object-cover"
                />
                {!image.isActive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-red-400 font-semibold">Inactiva</span>
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="text-white text-lg flex-1">{image.title}</CardTitle>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    image.gender === 'MALE' ? 'bg-cyan-500/20 text-cyan-400' :
                    image.gender === 'FEMALE' ? 'bg-pink-500/20 text-pink-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {image.gender === 'MALE' ? '♂ Men' : image.gender === 'FEMALE' ? '♀ Women' : '⚥ Unisex'}
                  </span>
                </div>
                {image.description && (
                  <p className="text-sm text-gray-400">{image.description}</p>
                )}
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {image.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">Order: {image.order}</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Dialog open={isEditDialogOpen && selectedImage?.id === image.id} onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) setSelectedImage(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedImage(image)}
                        className="flex-1 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-800 max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-white">Editar Imagen</DialogTitle>
                      </DialogHeader>
                      {selectedImage && (
                        <div className="space-y-3">
                          <div className="relative w-full h-48 bg-gray-800 rounded-lg overflow-hidden">
                            <Image
                              src={selectedImage.imageUrl}
                              alt={selectedImage.title}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-title" className="text-white">Título</Label>
                            <Input
                              id="edit-title"
                              value={selectedImage.title}
                              onChange={(e) => setSelectedImage({ ...selectedImage, title: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-description" className="text-white">Descripción</Label>
                            <Textarea
                              id="edit-description"
                              value={selectedImage.description || ''}
                              onChange={(e) => setSelectedImage({ ...selectedImage, description: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white"
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-order" className="text-white">Orden</Label>
                            <Input
                              id="edit-order"
                              type="number"
                              value={selectedImage.order}
                              onChange={(e) => setSelectedImage({ ...selectedImage, order: parseInt(e.target.value) || 0 })}
                              className="bg-gray-800 border-gray-700 text-white"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="edit-isActive"
                              checked={selectedImage.isActive}
                              onChange={(e) => setSelectedImage({ ...selectedImage, isActive: e.target.checked })}
                              className="w-4 h-4"
                            />
                            <Label htmlFor="edit-isActive" className="text-white">Imagen activa</Label>
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                          setIsEditDialogOpen(false)
                          setSelectedImage(null)
                        }}>Cancelar</Button>
                        <Button onClick={handleUpdateImage}>Guardar Cambios</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-gray-800">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-400">
                          Esta acción no se puede deshacer. Se eliminará permanentemente la imagen de la galería.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-800 text-white border-gray-700">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteImage(image.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {images.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-600 mb-4" />
              <p className="text-gray-400 text-center">No hay imágenes en la galería</p>
              <p className="text-sm text-gray-500 text-center mt-2">
                Agrega imágenes para que los clientes vean tu trabajo
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
