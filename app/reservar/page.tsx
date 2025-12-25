'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scissors,
  ArrowLeft,
  ArrowRight,
  Clock,
  DollarSign,
  Star,
  Phone,
  Instagram,
  Facebook,
  MessageCircle,
  Check,
  Calendar as CalendarIcon,
  Image as ImageIcon,
  Video,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { es } from 'date-fns/locale';

// Types
type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  image: string | null;
};

type Barber = {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string | null;
  hourlyRate: number | null;
  profileImage: string | null;
  phone: string | null;
  whatsappUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  twitterUrl: string | null;
  zelleEmail: string | null;
  zellePhone: string | null;
  cashappTag: string | null;
  rating: number | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  media: Array<{
    id: string;
    mediaType: string;
    mediaUrl: string;
    title: string | null;
  }>;
};

type Step = 'gender' | 'services' | 'barbers' | 'barber-profile' | 'datetime' | 'payment';

export default function ReservarPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<Step>('gender');
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if barberId is provided in URL (direct booking from barber page)
  useEffect(() => {
    const barberId = searchParams.get('barberId');
    if (barberId) {
      // Load barber directly and skip to services
      loadBarberAndSkipToServices(barberId);
    }
  }, [searchParams]);

  const loadBarberAndSkipToServices = async (barberId: string) => {
    try {
      // Fetch all barbers to get the selected one
      const res = await fetch('/api/barbers');
      const data = await res.json();
      if (res.ok) {
        const barbersArray = Array.isArray(data) ? data : (data.barbers || []);
        const barber = barbersArray.find((b: Barber) => b.id === barberId);
        
        if (barber) {
          // Fetch media for the barber
          try {
            const mediaRes = await fetch(`/api/barber/media?barberId=${barber.id}`);
            const mediaData = await mediaRes.json();
            barber.media = mediaData || [];
          } catch {
            barber.media = [];
          }

          setSelectedBarber(barber);
          // Skip to services step
          setCurrentStep('services');
          // Fetch all services (no gender filter when coming directly)
          fetchServices();
        }
      }
    } catch (error) {
      console.error('Error loading barber:', error);
      toast.error('Error al cargar barbero');
    }
  };

  // Fetch services when gender is selected
  useEffect(() => {
    if (selectedGender) {
      fetchServices();
    }
  }, [selectedGender]);

  // Fetch barbers when service is selected
  useEffect(() => {
    if (selectedService) {
      fetchBarbers();
    }
  }, [selectedService]);

  // Fetch available times when date is selected
  useEffect(() => {
    if (selectedDate && selectedBarber) {
      console.log('Fetching available times for:', selectedDate);
      fetchAvailableTimes();
    }
  }, [selectedDate, selectedBarber]);

  // Handler para selección de fecha
  const handleDateSelect = (date: Date | undefined) => {
    console.log('Date selected:', date);
    setSelectedDate(date);
    // Reset selected time when date changes
    if (date !== selectedDate) {
      setSelectedTime('');
    }
  };

  const fetchServices = async () => {
    try {
      const genderParam = selectedGender ? `?gender=${selectedGender}` : '';
      const res = await fetch(`/api/services${genderParam}`);
      const data = await res.json();
      if (res.ok) {
        // Asegurar que data es un array
        const servicesArray = Array.isArray(data) ? data : (data.services || []);
        setServices(servicesArray.filter((s: Service) => s));
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchBarbers = async () => {
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      if (res.ok) {
        // Ensure we're working with an array
        const barbersArray = Array.isArray(data) ? data : (data.barbers || []);
        
        // Fetch media for each barber
        const barbersWithMedia = await Promise.all(
          barbersArray.map(async (barber: any) => {
            try {
              const mediaRes = await fetch(`/api/barber/media?barberId=${barber.id}`);
              const mediaData = await mediaRes.json();
              return {
                ...barber,
                media: mediaData || [],
              };
            } catch {
              return { ...barber, media: [] };
            }
          })
        );
        setBarbers(barbersWithMedia);
      }
    } catch (error) {
      console.error('Error fetching barbers:', error);
    }
  };

  const fetchAvailableTimes = async () => {
    if (!selectedBarber || !selectedDate) return;

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const res = await fetch(`/api/availability?barberId=${selectedBarber.id}&date=${dateStr}`);
      const data = await res.json();
      
      console.log('Available times response:', data);
      
      if (res.ok && data.availableTimes) {
        setAvailableTimes(data.availableTimes);
      } else {
        setAvailableTimes([]);
      }
    } catch (error) {
      console.error('Error fetching available times:', error);
      setAvailableTimes([]);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    // If barber is already selected (from URL), skip barbers list and go to datetime
    if (selectedBarber) {
      setCurrentStep('datetime');
    } else {
      setCurrentStep('barbers');
    }
  };

  const handleBarberSelect = (barber: Barber) => {
    setSelectedBarber(barber);
    setCurrentStep('barber-profile');
  };

  const handleContinueToDateTime = () => {
    setCurrentStep('datetime');
  };

  const handleSubmitBooking = async () => {
    if (!session) {
      toast.error('Debes iniciar sesión para reservar');
      router.push('/auth');
      return;
    }

    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !paymentMethod) {
      toast.error('Por favor completa todos los campos incluyendo el método de pago');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId: selectedBarber.id,
          serviceId: selectedService.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          paymentMethod: paymentMethod,
          paymentReference: paymentReference || null,
          notes: notes,
        }),
      });

      if (res.ok) {
        toast.success('¡Cita reservada exitosamente!');
        router.push('/dashboard/cliente');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Error al reservar');
      }
    } catch (error) {
      toast.error('Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const barberId = searchParams.get('barberId');
    
    if (currentStep === 'payment') {
      setCurrentStep('datetime');
    } else if (currentStep === 'datetime') {
      // If we came with a barberId, go back to services
      // Otherwise go back to barber-profile
      if (barberId && selectedBarber) {
        setCurrentStep('services');
        setSelectedService(null);
      } else {
        setCurrentStep('barber-profile');
      }
    } else if (currentStep === 'barber-profile') {
      setCurrentStep('barbers');
      setSelectedBarber(null);
    } else if (currentStep === 'barbers') {
      setCurrentStep('services');
      setSelectedService(null);
    } else if (currentStep === 'services') {
      // If we came with a barberId, go back to barber page
      // Otherwise go back to gender selection
      if (barberId) {
        router.push('/barberos');
      } else {
        setCurrentStep('gender');
        setSelectedGender('');
      }
    } else if (currentStep === 'gender') {
      // Go back to home or dashboard
      if (status === 'authenticated') {
        router.push('/dashboard');
      } else {
        router.push('/inicio');
      }
    }
  };

  // Step 0: Select Gender
  const renderGenderStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">¿Para quién es el servicio?</h2>
        <p className="text-gray-400 text-lg">Selecciona para ver servicios personalizados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedGender('MALE');
            setCurrentStep('services');
          }}
          className="cursor-pointer"
        >
          <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-2 border-blue-500/30 hover:border-[#00f0ff] transition-all duration-300 overflow-hidden group">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <User className="w-12 h-12 text-[#00f0ff]" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Hombre</h3>
              <p className="text-gray-400">Servicios para caballeros</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setSelectedGender('FEMALE');
            setCurrentStep('services');
          }}
          className="cursor-pointer"
        >
          <Card className="bg-gradient-to-br from-pink-900/40 to-purple-900/40 border-2 border-pink-500/30 hover:border-[#ffd700] transition-all duration-300 overflow-hidden group">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/30 transition-colors">
                <User className="w-12 h-12 text-[#ffd700]" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Mujer</h3>
              <p className="text-gray-400">Servicios para damas</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );

  // Step 1: Select Service
  const renderServicesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Selecciona un Servicio</h2>
        <p className="text-gray-400">Elige el servicio que deseas reservar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <motion.div
            key={service.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleServiceSelect(service)}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900 border-gray-800 hover:border-[#00f0ff] transition-all duration-300 overflow-hidden group">
              <div className="relative h-48 bg-gray-800">
                {service.image ? (
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Scissors className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#ffd700] text-black px-3 py-1 rounded-full font-bold">
                  ${service.price}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{service.name}</h3>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {service.description || 'Sin descripción'}
                </p>
                <div className="flex items-center text-gray-500 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  {service.duration} minutos
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Step 2: Select Barber
  const renderBarbersStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Elige tu Barbero</h2>
        <p className="text-gray-400">Selecciona el profesional de tu preferencia</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {barbers.map((barber) => (
          <motion.div
            key={barber.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBarberSelect(barber)}
            className="cursor-pointer"
          >
            <Card className="bg-gray-900 border-gray-800 hover:border-[#00f0ff] transition-all duration-300 p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.4)]">
                  {barber.user.image ? (
                    <Image
                      src={barber.user.image}
                      alt={barber.user.name || 'Barbero'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Scissors className="w-10 h-10 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {barber.user.name || 'Barbero'}
              </h3>
              {barber.rating && (
                <div className="flex items-center justify-center gap-1 text-[#ffd700] mb-2">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">{barber.rating.toFixed(1)}</span>
                </div>
              )}
              {barber.specialties && (
                <p className="text-xs text-gray-500 line-clamp-2">{barber.specialties}</p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  // Step 3: Barber Profile
  const renderBarberProfileStep = () => {
    if (!selectedBarber) return null;

    const photos = selectedBarber.media.filter((m) => m.mediaType === 'PHOTO');
    const videos = selectedBarber.media.filter((m) => m.mediaType === 'VIDEO');

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        {/* Header con foto y info básica */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Foto de perfil */}
              <div className="relative w-40 h-40 flex-shrink-0 mx-auto md:mx-0">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.5)]">
                  {selectedBarber.profileImage ? (
                    <Image
                      src={selectedBarber.profileImage}
                      alt={selectedBarber.user.name || 'Barbero'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Scissors className="w-20 h-20 text-gray-600" />
                    </div>
                  )}
                </div>
              </div>

              {/* Información */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-4xl font-bold text-white mb-3">
                  {selectedBarber.user.name}
                </h2>

                {/* Calificación */}
                {selectedBarber.rating && (
                  <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(selectedBarber.rating || 0)
                              ? 'fill-[#ffd700] text-[#ffd700]'
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-[#ffd700]">
                      {selectedBarber.rating.toFixed(1)}
                    </span>
                  </div>
                )}

                {/* Especialidades */}
                {selectedBarber.specialties && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Especialidades:</h4>
                    <p className="text-gray-300">{selectedBarber.specialties}</p>
                  </div>
                )}

                {/* Tarifa */}
                {selectedBarber.hourlyRate && (
                  <div className="inline-flex items-center gap-2 bg-[#ffd700]/10 px-4 py-2 rounded-full">
                    <DollarSign className="w-5 h-5 text-[#ffd700]" />
                    <span className="text-[#ffd700] font-bold text-lg">
                      ${selectedBarber.hourlyRate}/hora
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biografía */}
        {selectedBarber.bio && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-[#00f0ff] mb-3">Sobre mí</h3>
              <p className="text-gray-300 leading-relaxed">{selectedBarber.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Redes Sociales y Contacto */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-[#00f0ff] mb-4">Contacto y Redes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedBarber.whatsappUrl && (
                <a
                  href={selectedBarber.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-green-600/20 hover:border-green-500 border border-gray-700 transition-all"
                >
                  <MessageCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-400">WhatsApp</p>
                    <p className="text-sm font-semibold text-white">Contactar</p>
                  </div>
                </a>
              )}

              {selectedBarber.instagramUrl && (
                <a
                  href={selectedBarber.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-pink-600/20 hover:border-pink-500 border border-gray-700 transition-all"
                >
                  <Instagram className="w-6 h-6 text-pink-500" />
                  <div>
                    <p className="text-xs text-gray-400">Instagram</p>
                    <p className="text-sm font-semibold text-white">Visitar</p>
                  </div>
                </a>
              )}

              {selectedBarber.facebookUrl && (
                <a
                  href={selectedBarber.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-blue-600/20 hover:border-blue-500 border border-gray-700 transition-all"
                >
                  <Facebook className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-400">Facebook</p>
                    <p className="text-sm font-semibold text-white">Visitar</p>
                  </div>
                </a>
              )}

              {selectedBarber.twitterUrl && (
                <a
                  href={selectedBarber.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg hover:bg-cyan-600/20 hover:border-cyan-500 border border-gray-700 transition-all"
                >
                  <svg className="w-6 h-6 text-cyan-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">TikTok/Twitter</p>
                    <p className="text-sm font-semibold text-white">Visitar</p>
                  </div>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Galería */}
        {(photos.length > 0 || videos.length > 0) && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-[#00f0ff] mb-4">Galería</h3>
              
              {/* Fotos */}
              {photos.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-[#ffd700]" />
                    <h4 className="text-lg font-semibold text-white">Fotos</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.slice(0, 8).map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer">
                        <Image
                          src={photo.mediaUrl}
                          alt={photo.title || 'Foto'}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {photo.title && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <p className="text-white text-sm">{photo.title}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-5 h-5 text-[#ffd700]" />
                    <h4 className="text-lg font-semibold text-white">Videos</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.slice(0, 4).map((video) => (
                      <div key={video.id} className="relative aspect-video rounded-lg overflow-hidden bg-gray-800">
                        <video
                          src={video.mediaUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Botón para continuar al calendario */}
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleContinueToDateTime}
            size="lg"
            className="bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black font-bold text-lg px-12 py-6 hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all duration-300"
          >
            Continuar a Fecha y Hora
            <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </motion.div>
    );
  };

  // Step 4: Date & Time
  const renderDateTimeStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Selecciona Fecha y Hora</h2>
        <p className="text-gray-400">Elige cuándo quieres tu cita</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendario */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-[#00f0ff] mb-4">Selecciona el Día</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="rounded-md border border-gray-700"
            />
            {selectedDate && (
              <div className="mt-4 p-3 bg-gradient-to-r from-[#00f0ff]/10 to-[#0099cc]/10 border border-[#00f0ff]/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Fecha seleccionada:</p>
                <p className="text-lg font-bold text-[#00f0ff]">
                  {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horarios */}
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-[#00f0ff] mb-4">Selecciona la Hora</h3>
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-center">
                  👈 Primero selecciona un día en el calendario
                </p>
              </div>
            ) : availableTimes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Clock className="w-16 h-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-center">
                  No hay horarios disponibles para este día
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Intenta con otra fecha
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      selectedTime === time
                        ? 'bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                        : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notas adicionales */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6">
          <Label htmlFor="notes" className="text-white text-lg mb-3 block">
            Notas adicionales (opcional)
          </Label>
          <Textarea
            id="notes"
            placeholder="Alguna preferencia o comentario especial..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Resumen y botón de confirmación */}
      {selectedDate && selectedTime && (
        <Card className="bg-gradient-to-r from-[#00f0ff]/10 to-[#ffd700]/10 border-[#00f0ff]">
          <CardContent className="p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Resumen de tu Reserva</h3>
            <div className="space-y-3 text-gray-300 mb-6">
              <div className="flex items-center gap-3">
                <Scissors className="w-5 h-5 text-[#00f0ff]" />
                <span>Servicio: <strong>{selectedService?.name}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-[#00f0ff]" />
                <span>Barbero: <strong>{selectedBarber?.user.name}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-[#00f0ff]" />
                <span>
                  Fecha: <strong>{format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}</strong>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#00f0ff]" />
                <span>Hora: <strong>{selectedTime}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-[#ffd700]" />
                <span>Precio: <strong className="text-[#ffd700] text-xl">${selectedService?.price}</strong></span>
              </div>
            </div>

            <Button
              onClick={() => setCurrentStep('payment')}
              size="lg"
              className="w-full bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black font-bold text-base md:text-xl py-3 md:py-6 hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all duration-300"
            >
              <ArrowRight className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              Continuar a Método de Pago
            </Button>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );

  // Step 5: Payment Method
  const renderPaymentStep = () => {
    if (!selectedBarber) return null;

    const hasZelle = selectedBarber.zelleEmail || selectedBarber.zellePhone;
    const hasCashapp = selectedBarber.cashappTag;

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6 max-w-4xl mx-auto"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Método de Pago</h2>
          <p className="text-gray-400">Selecciona cómo deseas realizar el pago</p>
        </div>

        {/* Barber's Payment Info */}
        <Card className="bg-gradient-to-r from-[#00f0ff]/5 to-[#ffd700]/5 border-[#00f0ff]/30">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#00f0ff]">
                {selectedBarber.profileImage ? (
                  <Image
                    src={selectedBarber.profileImage}
                    alt={selectedBarber.user.name || 'Barbero'}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#00f0ff] to-[#0099cc] flex items-center justify-center text-white font-bold text-xl">
                    {selectedBarber.user.name?.[0] || 'B'}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedBarber.user.name}</h3>
                <p className="text-gray-400">Métodos de pago aceptados</p>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              {hasZelle && (
                <div
                  onClick={() => setPaymentMethod('ZELLE')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'ZELLE'
                      ? 'border-purple-400 bg-purple-400/10'
                      : 'border-gray-700 bg-gray-800 hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-purple-400" />
                      <span className="text-xl font-bold text-white">Zelle</span>
                    </div>
                    {paymentMethod === 'ZELLE' && (
                      <Check className="w-6 h-6 text-purple-400" />
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    {selectedBarber.zelleEmail && (
                      <p className="text-gray-300">
                        <span className="text-gray-500">Email:</span>{' '}
                        <span className="font-semibold text-purple-300">{selectedBarber.zelleEmail}</span>
                      </p>
                    )}
                    {selectedBarber.zellePhone && (
                      <p className="text-gray-300">
                        <span className="text-gray-500">Teléfono:</span>{' '}
                        <span className="font-semibold text-purple-300">{selectedBarber.zellePhone}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {hasCashapp && (
                <div
                  onClick={() => setPaymentMethod('CASHAPP')}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                    paymentMethod === 'CASHAPP'
                      ? 'border-green-400 bg-green-400/10'
                      : 'border-gray-700 bg-gray-800 hover:border-green-400/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-6 h-6 text-green-400" />
                      <span className="text-xl font-bold text-white">CashApp</span>
                    </div>
                    {paymentMethod === 'CASHAPP' && (
                      <Check className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                  <p className="text-gray-300 text-sm">
                    <span className="text-gray-500">$Cashtag:</span>{' '}
                    <span className="font-semibold text-green-300">{selectedBarber.cashappTag}</span>
                  </p>
                </div>
              )}

              {/* Cash option always available */}
              <div
                onClick={() => setPaymentMethod('CASH')}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  paymentMethod === 'CASH'
                    ? 'border-[#ffd700] bg-[#ffd700]/10'
                    : 'border-gray-700 bg-gray-800 hover:border-[#ffd700]/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-6 h-6 text-[#ffd700]" />
                    <span className="text-xl font-bold text-white">Efectivo</span>
                  </div>
                  {paymentMethod === 'CASH' && (
                    <Check className="w-6 h-6 text-[#ffd700]" />
                  )}
                </div>
                <p className="text-gray-400 text-sm">Paga directamente en la barbería</p>
              </div>
            </div>

            {/* Payment Reference (optional) */}
            {(paymentMethod === 'ZELLE' || paymentMethod === 'CASHAPP') && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <Label htmlFor="paymentRef" className="text-white text-lg mb-3 block">
                  Referencia de Pago (Opcional)
                </Label>
                <Input
                  id="paymentRef"
                  placeholder="Ej: Últimos 4 dígitos de la transacción"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Esto ayuda a {selectedBarber.user.name} a confirmar tu pago más rápido
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary and Confirm */}
        {paymentMethod && (
          <Card className="bg-gradient-to-r from-[#00f0ff]/10 to-[#ffd700]/10 border-[#00f0ff]">
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold text-white mb-4">Confirma tu Reserva</h3>
              <div className="space-y-3 text-gray-300 mb-6">
                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5 text-[#00f0ff]" />
                  <span>Servicio: <strong>{selectedService?.name}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#00f0ff]" />
                  <span>Barbero: <strong>{selectedBarber?.user.name}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-[#00f0ff]" />
                  <span>
                    Fecha: <strong>{selectedDate && format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#00f0ff]" />
                  <span>Hora: <strong>{selectedTime}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#ffd700]" />
                  <span>
                    Método de Pago: <strong className="text-[#ffd700]">
                      {paymentMethod === 'ZELLE' ? 'Zelle' : paymentMethod === 'CASHAPP' ? 'CashApp' : 'Efectivo'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-[#ffd700]" />
                  <span>Precio: <strong className="text-[#ffd700] text-xl">${selectedService?.price}</strong></span>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-200 text-sm flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <span>
                    {paymentMethod === 'CASH' 
                      ? 'Recuerda llevar efectivo el día de tu cita.'
                      : `Realiza tu pago a través de ${paymentMethod === 'ZELLE' ? 'Zelle' : 'CashApp'} antes de tu cita. El barbero confirmará el pago.`
                    }
                  </span>
                </p>
              </div>

              <Button
                onClick={handleSubmitBooking}
                disabled={loading}
                size="lg"
                className="w-full bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black font-bold text-xl py-6 hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] transition-all duration-300"
              >
                {loading ? (
                  'Procesando...'
                ) : (
                  <>
                    <Check className="w-6 h-6 mr-2" />
                    Confirmar Reserva
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Navbar con logo BookMe */}
      <DashboardNavbar />
      
      {/* Progress indicator y Botón volver */}
      <div className="container mx-auto px-4 mt-8 mb-8">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="text-gray-400 hover:text-[#00f0ff] mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </Button>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['gender', 'services', 'barbers', 'barber-profile', 'datetime', 'payment'].map((step, index) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentStep === step
                  ? 'w-12 bg-gradient-to-r from-[#00f0ff] to-[#ffd700]'
                  : index <
                    ['gender', 'services', 'barbers', 'barber-profile', 'datetime', 'payment'].indexOf(currentStep)
                  ? 'w-8 bg-[#00f0ff]'
                  : 'w-8 bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4">
        <AnimatePresence mode="wait">
          {currentStep === 'gender' && renderGenderStep()}
          {currentStep === 'services' && renderServicesStep()}
          {currentStep === 'barbers' && renderBarbersStep()}
          {currentStep === 'barber-profile' && renderBarberProfileStep()}
          {currentStep === 'datetime' && renderDateTimeStep()}
          {currentStep === 'payment' && renderPaymentStep()}
        </AnimatePresence>
      </div>
    </div>
  );
}