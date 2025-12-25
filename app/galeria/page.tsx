'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Heart, Tag, Filter, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ShareFAB } from '@/components/share-fab';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { useI18n } from '@/lib/i18n/i18n-context';

interface GalleryImage {
  id: string;
  imageUrl: string;
  title: string;
  description: string | null;
  tags: string[];
  gender: string | null;
  likes: number;
  barberId: string | null;
  barber?: {
    user?: {
      name: string | null;
    };
  };
}

export default function GaleriaPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [filteredImages, setFilteredImages] = useState<GalleryImage[]>([]);
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    // Proteger la ruta - requiere autenticación
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }
    
    if (status === 'authenticated') {
      fetchGalleryImages();
      if (session?.user) {
        fetchLikedImages();
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    filterImages();
  }, [images, selectedGender, selectedTag]);

  const fetchGalleryImages = async () => {
    try {
      const response = await fetch('/api/gallery');
      if (response.ok) {
        const data = await response.json();
        setImages(data);
        
        // Extraer todos los tags únicos
        const tags = new Set<string>();
        data.forEach((img: GalleryImage) => {
          img.tags?.forEach(tag => tags.add(tag));
        });
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedImages = async () => {
    try {
      const liked = new Set<string>();
      // Verificar likes para cada imagen
      for (const img of images) {
        const response = await fetch(`/api/gallery/${img.id}/like`);
        if (response.ok) {
          const data = await response.json();
          if (data.liked) {
            liked.add(img.id);
          }
        }
      }
      setLikedImages(liked);
    } catch (error) {
      console.error('Error fetching liked images:', error);
    }
  };

  const handleLike = async (imageId: string) => {
    if (!session?.user) {
      toast.error(t('gallery.mustLogin'));
      return;
    }

    try {
      const response = await fetch(`/api/gallery/${imageId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Actualizar estado de like
        setLikedImages(prev => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(imageId);
          } else {
            newSet.delete(imageId);
          }
          return newSet;
        });

        // Actualizar contador de likes
        setImages(prev => prev.map(img => 
          img.id === imageId 
            ? { ...img, likes: data.likes } 
            : img
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error(t('gallery.likeError'));
    }
  };

  const filterImages = () => {
    let filtered = [...images];

    // Filtrar por género
    if (selectedGender !== 'ALL') {
      filtered = filtered.filter(img => 
        img.gender === selectedGender || img.gender === 'UNISEX'
      );
    }

    // Filtrar por tag
    if (selectedTag) {
      filtered = filtered.filter(img => 
        img.tags?.includes(selectedTag)
      );
    }

    setFilteredImages(filtered);
  };

  // Mostrar pantalla de carga mientras verifica autenticación
  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f0ff]"></div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (ya redirige en useEffect)
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Navbar con logo BookMe */}
      <DashboardNavbar />
      
      {/* Título y Filtros */}
      <div className="bg-black/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white text-center mb-4">
            <Sparkles className="inline w-6 h-6 text-[#ffd700] mr-2" />
            {t('gallery.title')}
          </h1>

          {/* Filtros de género */}
          <div className="flex gap-2 mb-3">
            <Button
              onClick={() => setSelectedGender('ALL')}
              variant={selectedGender === 'ALL' ? 'default' : 'outline'}
              size="sm"
              className={selectedGender === 'ALL' 
                ? 'bg-gradient-to-r from-[#00f0ff] to-[#0099cc] text-black' 
                : 'border-gray-700 text-gray-400'}
            >
              {t('common.all')}
            </Button>
            <Button
              onClick={() => setSelectedGender('MALE')}
              variant={selectedGender === 'MALE' ? 'default' : 'outline'}
              size="sm"
              className={selectedGender === 'MALE' 
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white' 
                : 'border-gray-700 text-gray-400'}
            >
              <User className="w-3 h-3 mr-1" />
              {t('gallery.men')}
            </Button>
            <Button
              onClick={() => setSelectedGender('FEMALE')}
              variant={selectedGender === 'FEMALE' ? 'default' : 'outline'}
              size="sm"
              className={selectedGender === 'FEMALE' 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white' 
                : 'border-gray-700 text-gray-400'}
            >
              <User className="w-3 h-3 mr-1" />
              {t('gallery.women')}
            </Button>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                onClick={() => setSelectedTag('')}
                variant={!selectedTag ? 'default' : 'outline'}
                size="sm"
                className={!selectedTag 
                  ? 'bg-[#ffd700] text-black' 
                  : 'border-gray-700 text-gray-400'}
              >
                <Tag className="w-3 h-3 mr-1" />
                {t('gallery.allTags')}
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  size="sm"
                  className={selectedTag === tag 
                    ? 'bg-[#ffd700] text-black whitespace-nowrap' 
                    : 'border-gray-700 text-gray-400 whitespace-nowrap'}
                >
                  {tag}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid (Instagram Style) */}
      <div className="container mx-auto px-4 py-6">
        {filteredImages.length === 0 ? (
          <div className="text-center py-20">
            <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">{t('gallery.noImages')}</p>
            <p className="text-gray-500 mt-2">{t('gallery.tryOtherFilters')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
            {filteredImages.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square group cursor-pointer overflow-hidden bg-gray-900"
              >
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                  loading={index < 8 ? "eager" : "lazy"}
                  priority={index < 4}
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-sm mb-1">{image.title}</h3>
                  {image.barber?.user?.name && (
                    <p className="text-[#00f0ff] text-xs mb-2">{t('gallery.by')} {image.barber.user.name}</p>
                  )}
                  
                  {/* Tags */}
                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {image.tags.slice(0, 2).map(tag => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-800/80 text-gray-300 px-2 py-0.5 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(image.id);
                      }}
                      className="flex items-center gap-1 text-white hover:scale-110 transition-transform"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          likedImages.has(image.id)
                            ? 'fill-red-500 text-red-500'
                            : 'fill-transparent'
                        }`}
                      />
                      <span className="text-sm font-semibold">{image.likes || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Like button sempre visível em mobile */}
                <div className="absolute bottom-2 right-2 md:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(image.id);
                    }}
                    className="bg-black/60 backdrop-blur-sm rounded-full p-2 shadow-lg"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        likedImages.has(image.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-white fill-transparent'
                      }`}
                    />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Contador */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          {t('gallery.showing')} {filteredImages.length} {t('gallery.of')} {images.length} {t('gallery.photos')}
        </div>
      </div>
      
      {/* FAB Buttons */}
      <ShareFAB />
    </div>
  );
}
