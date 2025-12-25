'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Image, Video, CalendarOff, Save, Trash2, Plus, Share2, Facebook, Instagram, Twitter, MessageCircle, Youtube, DollarSign, MessageSquare, Copy, Check, QrCode, Banknote, User, Camera, Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { PushNotificationButton } from '@/components/push-notification-button';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';

type Appointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
};

type Availability = {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
};

type DayOff = {
  id: string;
  date: string;
  reason?: string;
};

type Media = {
  id: string;
  mediaUrl: string;
  mediaType: 'PHOTO' | 'VIDEO';
  title?: string;
  description?: string;
};

const daysOfWeek = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

export default function BarberDashboard() {
  const { data: session, status } = useSession() || {};
  const { t } = useI18n();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [daysOff, setDaysOff] = useState<DayOff[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);

  // Day Off form state
  const [dayOffDate, setDayOffDate] = useState('');
  const [dayOffReason, setDayOffReason] = useState('');
  const [dayOffDialogOpen, setDayOffDialogOpen] = useState(false);

  // Media form state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaDescription, setMediaDescription] = useState('');
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Social media form state
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [phone, setPhone] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [zelleEmail, setZelleEmail] = useState('');
  const [zellePhone, setZellePhone] = useState('');
  const [cashappTag, setCashappTag] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  
  // QR codes and copy states
  const [zelleQR, setZelleQR] = useState('');
  const [cashappQR, setCashappQR] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Earnings state
  const [earnings, setEarnings] = useState<any>(null);
  const [earningsPeriod, setEarningsPeriod] = useState('week');

  // Estados para menú de navegación móvil
  const [activeTab, setActiveTab] = useState('calendar');
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingEarnings, setLoadingEarnings] = useState(false);

  // Manual payment form state
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false);
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentMethod, setManualPaymentMethod] = useState('CASH');
  const [manualPaymentDescription, setManualPaymentDescription] = useState('');
  const [manualPaymentClientName, setManualPaymentClientName] = useState('');
  const [savingManualPayment, setSavingManualPayment] = useState(false);

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'BARBER') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [session, status, router]);

  // Generate QR codes when payment info changes
  useEffect(() => {
    const generateQRCodes = async () => {
      // Generate Zelle QR
      if (zelleEmail || zellePhone) {
        const zelleData = `Zelle: ${zelleEmail || zellePhone}`;
        try {
          const res = await fetch('/api/qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: zelleData }),
          });
          if (res.ok) {
            const { qr } = await res.json();
            setZelleQR(qr);
          }
        } catch (error) {
          console.error('Error generating Zelle QR:', error);
        }
      }

      // Generate CashApp QR
      if (cashappTag) {
        try {
          const res = await fetch('/api/qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: cashappTag }),
          });
          if (res.ok) {
            const { qr } = await res.json();
            setCashappQR(qr);
          }
        } catch (error) {
          console.error('Error generating CashApp QR:', error);
        }
      }
    };

    if (zelleEmail || zellePhone || cashappTag) {
      generateQRCodes();
    }
  }, [zelleEmail, zellePhone, cashappTag]);

  // Copy to clipboard
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success('Copiado al portapapeles');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Handle profile image upload
  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('La imagen no debe superar 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/barber/profile/image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al subir imagen');
      }

      const data = await res.json();
      setProfileImage(data.imageUrl);
      toast.success('Foto de perfil actualizada correctamente');
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al subir la imagen');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load appointments
      const appointmentsRes = await fetch('/api/appointments');
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData.appointments || []);

      // Load availability
      const availabilityRes = await fetch('/api/barber/availability');
      const availabilityData = await availabilityRes.json();
      setAvailability(Array.isArray(availabilityData) ? availabilityData : []);

      // Load days off
      const daysOffRes = await fetch('/api/barber/days-off');
      const daysOffData = await daysOffRes.json();
      setDaysOff(Array.isArray(daysOffData) ? daysOffData : []);

      // Load media
      const mediaRes = await fetch('/api/barber/media');
      const mediaData = await mediaRes.json();
      setMedia(Array.isArray(mediaData) ? mediaData : []);

      // Load barber profile
      const profileRes = await fetch('/api/barber/profile');
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setBio(profileData.bio || '');
        setSpecialties(profileData.specialties || '');
        setHourlyRate(profileData.hourlyRate?.toString() || '');
        setPhone(profileData.phone || '');
        setFacebookUrl(profileData.facebookUrl || '');
        setInstagramUrl(profileData.instagramUrl || '');
        setTwitterUrl(profileData.twitterUrl || '');
        setTiktokUrl(profileData.tiktokUrl || '');
        setYoutubeUrl(profileData.youtubeUrl || '');
        setWhatsappUrl(profileData.whatsappUrl || '');
        setZelleEmail(profileData.zelleEmail || '');
        setZellePhone(profileData.zellePhone || '');
        setCashappTag(profileData.cashappTag || '');
        setProfileImage(profileData.profileImage || profileData.user?.image || null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const loadEarnings = async (period: string = 'week') => {
    try {
      setLoadingEarnings(true);
      const res = await fetch(`/api/barber/earnings?period=${period}`);
      
      if (!res.ok) throw new Error('Error al cargar ganancias');
      
      const data = await res.json();
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
      toast.error('Error al cargar ganancias');
    } finally {
      setLoadingEarnings(false);
    }
  };

  const markAsPaid = async (appointmentId: string) => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/mark-paid`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Error al marcar como pagado');

      toast.success('Pago registrado exitosamente');
      
      // Reload earnings and appointments
      loadEarnings(earningsPeriod);
      loadData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast.error('Error al registrar el pago');
    }
  };

  const saveManualPayment = async () => {
    try {
      // Validar campos
      if (!manualPaymentAmount || parseFloat(manualPaymentAmount) <= 0) {
        toast.error('Ingresa un monto válido');
        return;
      }

      if (!manualPaymentMethod) {
        toast.error('Selecciona un método de pago');
        return;
      }

      setSavingManualPayment(true);

      const res = await fetch('/api/barber/manual-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(manualPaymentAmount),
          paymentMethod: manualPaymentMethod,
          description: manualPaymentDescription || null,
          clientName: manualPaymentClientName || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al registrar el pago');
      }

      toast.success('Pago manual registrado exitosamente');
      
      // Reset form
      setManualPaymentAmount('');
      setManualPaymentMethod('CASH');
      setManualPaymentDescription('');
      setManualPaymentClientName('');
      setManualPaymentDialogOpen(false);
      
      // Reload earnings
      loadEarnings(earningsPeriod);
    } catch (error: any) {
      console.error('Error saving manual payment:', error);
      toast.error(error.message || 'Error al registrar el pago');
    } finally {
      setSavingManualPayment(false);
    }
  };

  const updateAvailability = async (day: Availability) => {
    try {
      const currentAvailability = Array.isArray(availability) ? availability : [];
      const updatedAvailability = currentAvailability.map((a) =>
        a.dayOfWeek === day.dayOfWeek ? day : a
      );

      const res = await fetch('/api/barber/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: updatedAvailability }),
      });

      if (!res.ok) throw new Error('Error al actualizar disponibilidad');

      const data = await res.json();
      setAvailability(Array.isArray(data.availability) ? data.availability : []);
      toast.success('Disponibilidad actualizada exitosamente');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Error al actualizar la disponibilidad');
    }
  };

  const addDayOff = async () => {
    if (!dayOffDate) {
      toast.error('Por favor selecciona una fecha');
      return;
    }

    try {
      const res = await fetch('/api/barber/days-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: dayOffDate,
          reason: dayOffReason,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al agregar día libre');
      }

      const data = await res.json();
      setDaysOff([...daysOff, data.dayOff]);
      toast.success('Día libre agregado exitosamente');
      setDayOffDialogOpen(false);
      setDayOffDate('');
      setDayOffReason('');
    } catch (error: any) {
      console.error('Error adding day off:', error);
      toast.error(error.message || 'Error al agregar día libre');
    }
  };

  const deleteDayOff = async (id: string) => {
    try {
      const res = await fetch(`/api/barber/days-off?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar día libre');

      setDaysOff(daysOff.filter((d) => d.id !== id));
      toast.success('Día libre eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting day off:', error);
      toast.error('Error al eliminar día libre');
    }
  };

  const addMedia = async () => {
    if (!mediaFile) {
      toast.error('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', mediaFile);
      formData.append('mediaType', mediaType);
      if (mediaTitle) formData.append('title', mediaTitle);
      if (mediaDescription) formData.append('description', mediaDescription);

      const res = await fetch('/api/barber/media', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al agregar media');
      }

      const data = await res.json();
      setMedia([data.media, ...media]);
      toast.success('Media agregada exitosamente');
      setMediaDialogOpen(false);
      setMediaFile(null);
      setMediaTitle('');
      setMediaDescription('');
    } catch (error: any) {
      console.error('Error adding media:', error);
      toast.error(error.message || 'Error al agregar media');
    } finally {
      setUploading(false);
    }
  };

  const deleteMedia = async (id: string) => {
    try {
      const res = await fetch(`/api/barber/media/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Error al eliminar media');

      setMedia(media.filter((m) => m.id !== id));
      toast.success('Media eliminada exitosamente');
    } catch (error) {
      console.error('Error deleting media:', error);
      toast.error('Error al eliminar media');
    }
  };

  const updateProfile = async () => {
    try {
      setSavingProfile(true);
      const res = await fetch('/api/barber/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio,
          specialties,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
          phone,
          facebookUrl,
          instagramUrl,
          twitterUrl,
          tiktokUrl,
          youtubeUrl,
          whatsappUrl,
          zelleEmail,
          zellePhone,
          cashappTag,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }

      toast.success('Perfil actualizado exitosamente');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Error al actualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#00f0ff]">Cargando...</div>
      </div>
    );
  }

  // Get today's and upcoming appointments
  const today = new Date().toISOString().split('T')[0];
  const upcomingAppointments = appointments
    .filter((apt) => apt.date >= today && apt.status !== 'CANCELLED')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 5);

  return (
    <>
      <DashboardNavbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#00f0ff]">Teams</h1>
            {session?.user?.name && (
              <p className="text-gray-300 text-base font-medium">{session.user.name}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
            <Link href="/inbox">
              <Button 
                variant="outline" 
                size="sm"
                className="border-gray-700 hover:border-[#00f0ff] hover:text-[#00f0ff] h-9"
              >
                <MessageSquare className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Mensajes</span>
              </Button>
            </Link>
            <PushNotificationButton />
            <Button
              onClick={() => router.push('/dashboard/barbero/publicar')}
              size="sm"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/50 h-9"
            >
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Publicar</span>
            </Button>
            </div>
            
            {/* Profile Image - Right Side */}
            <div className="relative group cursor-pointer" onClick={() => profileImageInputRef.current?.click()}>
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#00f0ff]/20 to-[#0099cc]/20 border-3 border-[#00f0ff] shadow-lg shadow-[#00f0ff]/30">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={session?.user?.name || 'Barbero'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-[#00f0ff]/50" />
                  </div>
                )}
              </div>
              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
            <input
              ref={profileImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageUpload}
            />
          </div>
        </div>

        {/* Payment Methods Section */}
        {(zelleEmail || zellePhone || cashappTag) && (
          <Card className="bg-gradient-to-br from-green-900/20 to-purple-900/20 border-2 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-[#ffd700]" />
                💰 Recibir Pagos
              </CardTitle>
              <CardDescription className="text-gray-300">
                Muestra estos códigos QR o copia los datos para recibir pagos de tus clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Zelle Card */}
                {(zelleEmail || zellePhone) && (
                  <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-purple-400">Z</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Zelle</h3>
                        <p className="text-xs text-gray-400">Pago instantáneo</p>
                      </div>
                    </div>

                    {/* QR Code */}
                    {zelleQR && (
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <img src={zelleQR} alt="Zelle QR" className="w-40 h-40" />
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="space-y-3">
                      {zelleEmail && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 uppercase">Email</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-white flex-1 truncate bg-black/30 px-3 py-2 rounded">
                              {zelleEmail}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(zelleEmail, 'zelleEmail')}
                              className="border-purple-500 hover:bg-purple-500/20"
                            >
                              {copiedField === 'zelleEmail' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {zellePhone && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-400 uppercase">Teléfono</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono text-white flex-1 truncate bg-black/30 px-3 py-2 rounded">
                              {zellePhone}
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyToClipboard(zellePhone, 'zellePhone')}
                              className="border-purple-500 hover:bg-purple-500/20"
                            >
                              {copiedField === 'zellePhone' ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CashApp Card */}
                {cashappTag && (
                  <div className="bg-green-900/30 border-2 border-green-500/50 rounded-lg p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <span className="text-2xl font-bold text-green-400">$</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Cash App</h3>
                        <p className="text-xs text-gray-400">Pago móvil</p>
                      </div>
                    </div>

                    {/* QR Code */}
                    {cashappQR && (
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <img src={cashappQR} alt="CashApp QR" className="w-40 h-40" />
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 uppercase">$Cashtag</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono font-bold text-green-400 flex-1 truncate bg-black/30 px-3 py-2 rounded">
                          {cashappTag}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(cashappTag, 'cashappTag')}
                          className="border-green-500 hover:bg-green-500/20"
                        >
                          {copiedField === 'cashappTag' ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash Card */}
                <div className="bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-[#ffd700]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Efectivo</h3>
                      <p className="text-xs text-gray-400">Pago tradicional</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Banknote className="w-20 h-20 text-[#ffd700] mx-auto mb-4" />
                      <p className="text-white font-semibold">Acepto efectivo</p>
                      <p className="text-sm text-gray-400 mt-2">Pago directo en la barbería</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-blue-400">💡 Tip:</span> El cliente puede escanear el código QR con su app de pago, 
                  o puedes copiar los datos y enviárselos por mensaje.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Divider and Section Title */}
        <div className="mt-12 mb-6">
          <div className="h-px bg-gradient-to-r from-transparent via-[#00f0ff]/50 to-transparent mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('barber.calendarManagement')}</h2>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 mt-0">
        {/* Botón de menú para móvil */}
        <div className="lg:hidden">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button className="w-full bg-gradient-to-r from-[#00f0ff] to-blue-500 hover:from-[#00f0ff]/90 hover:to-blue-500/90 text-black font-semibold h-12">
                <Menu className="w-5 h-5 mr-2" />
                {t('barber.calendarManagement')}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-zinc-900 border-zinc-800 h-[70vh]">
              <SheetHeader>
                <SheetTitle className="text-[#00f0ff]">{t('barber.management')}</SheetTitle>
                <SheetDescription className="text-gray-400">
                  {t('barber.selectSection')}
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-3 mt-6">
                <Button
                  onClick={() => { setActiveTab('calendar'); setMenuOpen(false); }}
                  className={`justify-start h-14 ${activeTab === 'calendar' ? 'bg-[#00f0ff] text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  <Calendar className="w-5 h-5 mr-3" />
                  {t('barber.calendar')}
                </Button>
                <Button
                  onClick={() => { setActiveTab('hours'); setMenuOpen(false); }}
                  className={`justify-start h-14 ${activeTab === 'hours' ? 'bg-[#ffd700] text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  {t('barber.hours')}
                </Button>
                <Button
                  onClick={() => { setActiveTab('days-off'); setMenuOpen(false); }}
                  className={`justify-start h-14 ${activeTab === 'days-off' ? 'bg-purple-500 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  <CalendarOff className="w-5 h-5 mr-3" />
                  {t('barber.daysOff')}
                </Button>
                <Button
                  onClick={() => { setActiveTab('gallery'); setMenuOpen(false); }}
                  className={`justify-start h-14 ${activeTab === 'gallery' ? 'bg-green-500 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  <Image className="w-5 h-5 mr-3" />
                  {t('barber.gallery')}
                </Button>
                <Button
                  onClick={() => { setActiveTab('social'); setMenuOpen(false); }}
                  className={`justify-start h-14 ${activeTab === 'social' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  <Share2 className="w-5 h-5 mr-3" />
                  {t('barber.socialMedia')}
                </Button>
                <Button
                  onClick={() => { setActiveTab('earnings'); setMenuOpen(false); loadEarnings(earningsPeriod); }}
                  className={`justify-start h-14 ${activeTab === 'earnings' ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}
                >
                  <DollarSign className="w-5 h-5 mr-3" />
                  {t('barber.earnings')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs para desktop */}
        <TabsList className="hidden lg:grid w-full grid-cols-3 xl:grid-cols-6 bg-zinc-900 gap-1 p-1">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-[#00f0ff] data-[state=active]:text-black text-xs xl:text-sm py-3">
            <Calendar className="w-4 xl:w-5 h-4 xl:h-5 mr-1 xl:mr-2 text-[#00f0ff]" />
            <span>{t('barber.calendar')}</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-[#ffd700] data-[state=active]:text-black text-xs xl:text-sm py-3">
            <Clock className="w-4 xl:w-5 h-4 xl:h-5 mr-1 xl:mr-2 text-[#ffd700]" />
            <span>{t('barber.hours')}</span>
          </TabsTrigger>
          <TabsTrigger value="days-off" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white text-xs xl:text-sm py-3">
            <CalendarOff className="w-4 xl:w-5 h-4 xl:h-5 mr-1 xl:mr-2 text-purple-400" />
            <span className="hidden md:inline">{t('barber.daysOff')}</span>
            <span className="md:hidden">{t('barber.days')}</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="data-[state=active]:bg-green-500 data-[state=active]:text-white text-xs xl:text-sm py-3">
            <Image className="w-4 xl:w-5 h-4 xl:h-5 mr-1 xl:mr-2 text-green-400" />
            <span>{t('barber.gallery')}</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs xl:text-sm py-3">
            <Share2 className="w-4 xl:w-5 h-4 xl:h-5 mr-1 xl:mr-2 text-blue-400" />
            <span>{t('barber.networks')}</span>
          </TabsTrigger>
          <TabsTrigger value="earnings" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-xs xl:text-sm py-3" onClick={() => loadEarnings(earningsPeriod)}>
            <DollarSign className="w-4 xl:w-5 h-4 xl:h-5 mr-1 xl:mr-2 text-emerald-400" />
            <span>{t('barber.earnings')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-[#00f0ff]">{t('barber.upcomingAppointments')}</CardTitle>
              <CardDescription>{t('barber.yourScheduledAppointments')}</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No tienes citas próximas</p>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <div key={apt.id} className="space-y-2">
                      <div className="p-4 rounded-lg border border-zinc-800 bg-black hover:border-[#00f0ff] transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2 flex-1">
                            <p className="font-semibold text-white">{apt.client.name}</p>
                            <p className="text-sm text-[#ffd700]">{apt.service.name}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(apt.date).toLocaleDateString('es-ES')} a las {apt.time}
                            </p>
                            <p className="text-xs text-gray-500">Duración: {apt.service.duration} min</p>
                          </div>
                          <span
                            className={
                              apt.status === 'CONFIRMED'
                                ? 'px-3 py-1 rounded-full text-xs bg-green-900 text-green-300'
                                : 'px-3 py-1 rounded-full text-xs bg-yellow-900 text-yellow-300'
                            }
                          >
                            {apt.status === 'CONFIRMED' ? 'Confirmado' : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                      {/* Quick Actions Submenu - Iconos compactos en móvil */}
                      <div className="flex items-center justify-end gap-1 px-2">
                        <Link href="/inbox">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 sm:px-3 hover:bg-zinc-800 hover:text-[#00f0ff]"
                          >
                            <MessageSquare className="w-3.5 h-3.5 sm:mr-1.5" />
                            <span className="hidden sm:inline text-xs">Mensaje</span>
                          </Button>
                        </Link>
                        <AddToCalendarButton
                          appointmentId={apt.id}
                          variant="ghost"
                          size="sm"
                          showText={false}
                          appointmentData={{
                            date: apt.date,
                            time: apt.time,
                            service: {
                              name: apt.service.name,
                              duration: apt.service.duration,
                            },
                            barber: {
                              name: session?.user?.name || 'Barbero',
                              email: session?.user?.email || '',
                            },
                            client: {
                              name: apt.client.name,
                              email: apt.client.email,
                            },
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-[#00f0ff]">Horario Semanal</CardTitle>
              <CardDescription>Configura tu disponibilidad para cada día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {daysOfWeek.map((day) => {
                  const dayAvailability = (Array.isArray(availability) ? availability : []).find(
                    (a) => a.dayOfWeek === day.value
                  ) || {
                    id: '',
                    dayOfWeek: day.value,
                    startTime: '09:00',
                    endTime: '18:00',
                    isAvailable: true,
                  };

                  return (
                    <div
                      key={day.value}
                      className="p-4 rounded-lg border border-zinc-800 bg-black"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
                          <div className="w-full sm:w-32">
                            <p className="font-semibold text-white">{day.label}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={dayAvailability.isAvailable}
                              onCheckedChange={(checked) => {
                                updateAvailability({
                                  ...dayAvailability,
                                  isAvailable: checked,
                                });
                              }}
                            />
                            <span className="text-sm text-gray-400">
                              {dayAvailability.isAvailable ? 'Disponible' : 'No disponible'}
                            </span>
                          </div>
                          {dayAvailability.isAvailable && (
                            <div className="flex items-center space-x-2 w-full sm:w-auto">
                              <Input
                                type="time"
                                value={dayAvailability.startTime}
                                onChange={(e) => {
                                  updateAvailability({
                                    ...dayAvailability,
                                    startTime: e.target.value,
                                  });
                                }}
                                className="w-full sm:w-32 bg-zinc-800 border-zinc-700 text-white"
                              />
                              <span className="text-gray-400">-</span>
                              <Input
                                type="time"
                                value={dayAvailability.endTime}
                                onChange={(e) => {
                                  updateAvailability({
                                    ...dayAvailability,
                                    endTime: e.target.value,
                                  });
                                }}
                                className="w-full sm:w-32 bg-zinc-800 border-zinc-700 text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Days Off Tab */}
        <TabsContent value="days-off" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-[#00f0ff]">{t('barber.daysOff')}</CardTitle>
                  <CardDescription>Gestiona tus días libres</CardDescription>
                </div>
                <Dialog open={dayOffDialogOpen} onOpenChange={setDayOffDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#00f0ff] text-black hover:bg-[#00d4dd]">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Día Libre
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-[#00f0ff]">Agregar Día Libre</DialogTitle>
                      <DialogDescription>
                        Selecciona una fecha para marcar como día libre
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="date">Fecha</Label>
                        <Input
                          id="date"
                          type="date"
                          value={dayOffDate}
                          onChange={(e) => setDayOffDate(e.target.value)}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="reason">Razón (opcional)</Label>
                        <Textarea
                          id="reason"
                          value={dayOffReason}
                          onChange={(e) => setDayOffReason(e.target.value)}
                          placeholder="Ej: Vacaciones, asunto personal..."
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <Button
                        onClick={addDayOff}
                        className="w-full bg-[#00f0ff] text-black hover:bg-[#00d4dd]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Guardar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {daysOff.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No tienes días libres programados
                </p>
              ) : (
                <div className="space-y-4">
                  {daysOff.map((dayOff) => (
                    <div
                      key={dayOff.id}
                      className="p-4 rounded-lg border border-zinc-800 bg-black flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {new Date(dayOff.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        {dayOff.reason && (
                          <p className="text-sm text-gray-400 mt-1">{dayOff.reason}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => deleteDayOff(dayOff.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-[#00f0ff]">{t('barber.myGallery')}</CardTitle>
                  <CardDescription>
                    Sube fotos y videos de tu trabajo para mostrar en tu perfil
                  </CardDescription>
                </div>
                <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#ffd700] text-black hover:bg-[#ffed4e]">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar Media
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-[#00f0ff]">Agregar Foto o Video</DialogTitle>
                      <DialogDescription>
                        Sube una foto o video desde tu dispositivo
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mediaType">Tipo</Label>
                        <Select value={mediaType} onValueChange={(value: any) => setMediaType(value)}>
                          <SelectTrigger className="bg-zinc-800 border-zinc-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="PHOTO">Foto</SelectItem>
                            <SelectItem value="VIDEO">Video</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="mediaFile">Archivo</Label>
                        <Input
                          id="mediaFile"
                          type="file"
                          accept={mediaType === 'PHOTO' ? 'image/*' : 'video/*'}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setMediaFile(file);
                          }}
                          className="bg-zinc-800 border-zinc-700 cursor-pointer"
                        />
                        {mediaFile && (
                          <p className="text-xs text-gray-400 mt-2">
                            Archivo seleccionado: {mediaFile.name} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {mediaType === 'PHOTO' 
                            ? 'Imágenes: máximo 50MB (JPEG, PNG, WebP, GIF)' 
                            : 'Videos: máximo 100MB (MP4, MOV, WebM)'}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="mediaTitle">Título (opcional)</Label>
                        <Input
                          id="mediaTitle"
                          value={mediaTitle}
                          onChange={(e) => setMediaTitle(e.target.value)}
                          placeholder="Título de la foto/video"
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <div>
                        <Label htmlFor="mediaDescription">Descripción (opcional)</Label>
                        <Textarea
                          id="mediaDescription"
                          value={mediaDescription}
                          onChange={(e) => setMediaDescription(e.target.value)}
                          placeholder="Describe tu trabajo..."
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                      <Button
                        onClick={addMedia}
                        disabled={uploading}
                        className="w-full bg-[#ffd700] text-black hover:bg-[#ffed4e] disabled:opacity-50"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {uploading ? 'Subiendo...' : 'Guardar'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {media.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No tienes fotos o videos en tu galería
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {media.map((item) => (
                    <div
                      key={item.id}
                      className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-black"
                    >
                      <div className="aspect-square relative">
                        {item.mediaType === 'PHOTO' ? (
                          <img
                            src={item.mediaUrl}
                            alt={item.title || 'Galería'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={item.mediaUrl}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all flex items-center justify-center">
                          <Button
                            onClick={() => deleteMedia(item.id)}
                            variant="destructive"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                      {(item.title || item.description) && (
                        <div className="p-3">
                          {item.title && (
                            <p className="font-semibold text-white text-sm">{item.title}</p>
                          )}
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-1">{item.description}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-[#00f0ff]">Perfil y Redes Sociales</CardTitle>
              <CardDescription>Actualiza tu información de perfil y enlaces de redes sociales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Información del Perfil</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="bio">Biografía</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuéntale a tus clientes sobre ti..."
                      className="bg-zinc-800 border-zinc-700 min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialties">Especialidades</Label>
                    <Input
                      id="specialties"
                      value={specialties}
                      onChange={(e) => setSpecialties(e.target.value)}
                      placeholder="Ej: Fade, Pompadour, Diseños"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hourlyRate">Tarifa por Hora ($)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        placeholder="25.00"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-zinc-800 border-zinc-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-lg font-semibold text-white">Redes Sociales</h3>
                <p className="text-sm text-gray-400">Agrega tus enlaces de redes sociales para que los clientes puedan conectarse contigo</p>
                
                <div className="grid gap-4">
                  {/* Facebook */}
                  <div>
                    <Label htmlFor="facebook" className="flex items-center">
                      <Facebook className="w-4 h-4 mr-2 text-blue-500" />
                      Facebook
                    </Label>
                    <Input
                      id="facebook"
                      value={facebookUrl}
                      onChange={(e) => setFacebookUrl(e.target.value)}
                      placeholder="https://facebook.com/tu-perfil"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  {/* Instagram */}
                  <div>
                    <Label htmlFor="instagram" className="flex items-center">
                      <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                      Instagram
                    </Label>
                    <Input
                      id="instagram"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://instagram.com/tu-usuario"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  {/* Twitter */}
                  <div>
                    <Label htmlFor="twitter" className="flex items-center">
                      <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                      Twitter / X
                    </Label>
                    <Input
                      id="twitter"
                      value={twitterUrl}
                      onChange={(e) => setTwitterUrl(e.target.value)}
                      placeholder="https://twitter.com/tu-usuario"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  {/* TikTok */}
                  <div>
                    <Label htmlFor="tiktok" className="flex items-center">
                      <Video className="w-4 h-4 mr-2 text-gray-300" />
                      TikTok
                    </Label>
                    <Input
                      id="tiktok"
                      value={tiktokUrl}
                      onChange={(e) => setTiktokUrl(e.target.value)}
                      placeholder="https://tiktok.com/@tu-usuario"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  {/* YouTube */}
                  <div>
                    <Label htmlFor="youtube" className="flex items-center">
                      <Youtube className="w-4 h-4 mr-2 text-red-500" />
                      YouTube
                    </Label>
                    <Input
                      id="youtube"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://youtube.com/@tu-canal"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div>
                    <Label htmlFor="whatsapp" className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                      WhatsApp
                    </Label>
                    <Input
                      id="whatsapp"
                      value={whatsappUrl}
                      onChange={(e) => setWhatsappUrl(e.target.value)}
                      placeholder="https://wa.me/1234567890"
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Methods Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-[#ffd700]" />
                  Formas de Pago Personales
                </h3>
                <p className="text-sm text-gray-400">Configura tus cuentas personales para recibir pagos directamente de tus clientes</p>
                
                <div className="grid gap-4">
                  {/* Zelle Email */}
                  <div>
                    <Label htmlFor="zelleEmail" className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                      Zelle - Email
                    </Label>
                    <Input
                      id="zelleEmail"
                      type="email"
                      value={zelleEmail}
                      onChange={(e) => setZelleEmail(e.target.value)}
                      placeholder="tu-email@ejemplo.com"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email registrado en Zelle</p>
                  </div>

                  {/* Zelle Phone */}
                  <div>
                    <Label htmlFor="zellePhone" className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-purple-400" />
                      Zelle - Teléfono
                    </Label>
                    <Input
                      id="zellePhone"
                      type="tel"
                      value={zellePhone}
                      onChange={(e) => setZellePhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Teléfono registrado en Zelle</p>
                  </div>

                  {/* CashApp */}
                  <div>
                    <Label htmlFor="cashapp" className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-400" />
                      CashApp - $Cashtag
                    </Label>
                    <Input
                      id="cashapp"
                      value={cashappTag}
                      onChange={(e) => setCashappTag(e.target.value)}
                      placeholder="$tuusuario"
                      className="bg-zinc-800 border-zinc-700 text-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tu $cashtag de CashApp (ej: $JohnDoe)</p>
                  </div>
                </div>

                {/* Save Button */}
                <Button
                  onClick={updateProfile}
                  disabled={savingProfile}
                  className="w-full bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black hover:opacity-90 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingProfile ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-4">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold text-white">Mis Ganancias</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => setManualPaymentDialogOpen(true)}
                className="bg-gradient-to-r from-[#00f0ff] to-[#0088ff] hover:from-[#00d4e6] hover:to-[#0077dd] text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrar Pago
              </Button>
              <Select value={earningsPeriod} onValueChange={(value) => { setEarningsPeriod(value); loadEarnings(value); }}>
                <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="week" className="text-white">Esta Semana</SelectItem>
                  <SelectItem value="month" className="text-white">Este Mes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingEarnings ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff]"></div>
            </div>
          ) : earnings ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Total Ganado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-400">
                      ${earnings.summary?.totalEarnings?.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Clientes Atendidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-400">
                      {earnings.summary?.totalClients || 0}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Promedio/Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-purple-400">
                      ${earnings.summary?.averagePerClient?.toFixed(2) || '0.00'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Method Breakdown */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-[#00f0ff]">Desglose por Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {earnings.byPaymentMethod && Object.entries(earnings.byPaymentMethod).map(([method, data]: [string, any]) => (
                      <div key={method} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            method === 'CASH' ? 'bg-yellow-500/20' :
                            method === 'ZELLE' ? 'bg-purple-500/20' :
                            method === 'CASHAPP' ? 'bg-green-500/20' : 'bg-gray-500/20'
                          }`}>
                            <DollarSign className={`w-5 h-5 ${
                              method === 'CASH' ? 'text-yellow-400' :
                              method === 'ZELLE' ? 'text-purple-400' :
                              method === 'CASHAPP' ? 'text-green-400' : 'text-gray-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {method === 'CASH' ? 'Efectivo' :
                               method === 'ZELLE' ? 'Zelle' :
                               method === 'CASHAPP' ? 'CashApp' : method}
                            </p>
                            <p className="text-sm text-gray-400">{data.count} cliente(s)</p>
                          </div>
                        </div>
                        <p className="text-xl font-bold text-white">${data.total.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-[#00f0ff]">Últimos Pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnings.recentPayments && earnings.recentPayments.length > 0 ? (
                      earnings.recentPayments.map((payment: any) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-zinc-800">
                          <div className="flex-1">
                            <p className="font-semibold text-white">{payment.clientName}</p>
                            <p className="text-sm text-gray-400">{payment.serviceName}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.date).toLocaleDateString('es-ES')} - {payment.time}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">${payment.amount.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">
                              {payment.paymentMethod === 'CASH' ? 'Efectivo' :
                               payment.paymentMethod === 'ZELLE' ? 'Zelle' :
                               payment.paymentMethod === 'CASHAPP' ? 'CashApp' : payment.paymentMethod}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-400 py-4">No hay pagos registrados en este período</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Pending Payments */}
              {appointments.filter((apt) => apt.status === 'COMPLETED' && apt.paymentStatus === 'PENDING' && apt.paymentMethod === 'CASH').length > 0 && (
                <Card className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-orange-500/30">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-400" />
                      Pagos Pendientes en Efectivo
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Marca estos servicios como pagados cuando recibas el efectivo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {appointments
                        .filter((apt) => apt.status === 'COMPLETED' && apt.paymentStatus === 'PENDING' && apt.paymentMethod === 'CASH')
                        .map((apt) => (
                          <div key={apt.id} className="flex items-center justify-between p-4 bg-black/30 rounded-lg border border-orange-500/30">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{apt.client.name}</p>
                              <p className="text-sm text-gray-400">{apt.service.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(apt.date).toLocaleDateString('es-ES')} - {apt.time}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-xl font-bold text-orange-400">${apt.service.price.toFixed(2)}</p>
                              <Button
                                onClick={() => markAsPaid(apt.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Marcar Pagado
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="py-12">
                <p className="text-center text-gray-400">No hay datos de ganancias disponibles</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        </Tabs>

        {/* Manual Payment Dialog */}
        <Dialog open={manualPaymentDialogOpen} onOpenChange={setManualPaymentDialogOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#00f0ff]">Registrar Pago Manual</DialogTitle>
              <DialogDescription className="text-gray-400">
                Registra pagos en efectivo que no están vinculados a una cita de la app
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
            {/* Amount */}
            <div>
              <Label htmlFor="manual-amount" className="text-white">
                Monto * <span className="text-sm text-gray-400">(USD)</span>
              </Label>
              <Input
                id="manual-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="25.00"
                value={manualPaymentAmount}
                onChange={(e) => setManualPaymentAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="manual-payment-method" className="text-white">Método de Pago *</Label>
              <Select value={manualPaymentMethod} onValueChange={setManualPaymentMethod}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="CASH" className="text-white">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-yellow-400" />
                      Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="ZELLE" className="text-white">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-purple-400" />
                      Zelle
                    </div>
                  </SelectItem>
                  <SelectItem value="CASHAPP" className="text-white">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      CashApp
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client Name */}
            <div>
              <Label htmlFor="manual-client-name" className="text-white">
                Nombre del Cliente <span className="text-sm text-gray-400">(opcional)</span>
              </Label>
              <Input
                id="manual-client-name"
                type="text"
                placeholder="Juan Pérez"
                value={manualPaymentClientName}
                onChange={(e) => setManualPaymentClientName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="manual-description" className="text-white">
                Descripción del Servicio <span className="text-sm text-gray-400">(opcional)</span>
              </Label>
              <Textarea
                id="manual-description"
                placeholder="Ej: Corte de cabello y barba"
                value={manualPaymentDescription}
                onChange={(e) => setManualPaymentDescription(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white"
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualPaymentDialogOpen(false)}
                disabled={savingManualPayment}
                className="border-zinc-700 text-white hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={saveManualPayment}
                disabled={savingManualPayment}
                className="bg-gradient-to-r from-[#00f0ff] to-[#0088ff] hover:from-[#00d4e6] hover:to-[#0077dd] text-black font-semibold"
              >
                {savingManualPayment ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Registrar Pago
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
