'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Calendar, Clock, Lock, Mail, User, ArrowLeft, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { ShareFAB } from '@/components/share-fab';
import { PushNotificationButton } from '@/components/push-notification-button';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  service: {
    name: string;
    price: number;
    duration: number;
  } | null;
  barber: {
    profileImage: string | null;
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  } | null;
}

export default function ClienteDashboard() {
  const { data: session, status, update } = useSession() || {};
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/auth";
      return;
    }

    if (session?.user) {
      setProfileImage(session.user.image || null);
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      fetchAppointments();
    }
  }, [session, status]);

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      
      if (res.ok) {
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 5MB");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/user/profile/image", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.imageUrl);
        await update();
        toast.success("Foto actualizada correctamente");
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Error al subir la imagen");
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      toast.error("Error al subir la imagen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        await update();
        toast.success("Nombre actualizado correctamente");
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al actualizar el nombre");
      }
    } catch (error) {
      toast.error("Error al actualizar el nombre");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!email.trim()) {
      toast.error("El email no puede estar vacío");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Formato de email inválido");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        await update();
        toast.success("Email actualizado correctamente");
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al actualizar el email");
      }
    } catch (error) {
      toast.error("Error al actualizar el email");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (res.ok) {
        toast.success("Contraseña actualizada");
        setPasswords({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const data = await res.json();
        toast.error(data.message || "Error al cambiar contraseña");
      }
    } catch (error) {
      toast.error("Error al cambiar contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00f0ff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <DashboardNavbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/inicio">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t('client.myProfile')}</h1>
              <p className="text-gray-400">{t('client.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/inbox">
              <Button variant="outline" className="border-gray-700 hover:border-[#00f0ff] hover:text-[#00f0ff]">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Mensajes</span>
              </Button>
            </Link>
            <PushNotificationButton />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Perfil */}
          <Card className="lg:col-span-1 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-[#00f0ff]">{t('client.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Foto de perfil */}
              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Avatar className="w-32 h-32 border-4 border-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                    <AvatarImage src={profileImage || undefined} />
                    <AvatarFallback className="bg-gray-800 text-white text-2xl">
                      {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-gray-500 mt-2">{t('client.clickToChangePhoto')}</p>
              </div>

              {/* Nombre */}
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#00f0ff]" />
                  Nombre
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Tu nombre"
                  />
                  <Button
                    onClick={handleNameUpdate}
                    disabled={isLoading}
                    className="bg-[#00f0ff] hover:bg-[#00d0dd] text-black"
                  >
                    Guardar
                  </Button>
                </div>
              </div>

              {/* Email */}
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#00f0ff]" />
                  Email
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="tu@email.com"
                  />
                  <Button
                    onClick={handleEmailUpdate}
                    disabled={isLoading}
                    className="bg-[#00f0ff] hover:bg-[#00d0dd] text-black"
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña */}
          <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-[#ffd700]">Cambiar Contraseña</CardTitle>
              <CardDescription className="text-gray-400">
                Actualiza tu contraseña de acceso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00f0ff]" />
                  Contraseña Actual
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="mt-2 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00f0ff]" />
                  Nueva Contraseña
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="mt-2 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#00f0ff]" />
                  Confirmar Nueva Contraseña
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="mt-2 bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <Button
                onClick={handlePasswordChange}
                disabled={isLoading || !passwords.currentPassword || !passwords.newPassword}
                className="w-full bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.5)]"
              >
                {isLoading ? "Actualizando..." : "Actualizar Contraseña"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Historial de Citas */}
        <Card className="mt-6 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-[#00f0ff]">Historial de Citas</CardTitle>
            <CardDescription className="text-gray-400">
              Tus citas recientes y próximas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No tienes citas registradas</p>
                <Button
                  onClick={() => window.location.href = "/reservar"}
                  className="mt-4 bg-gradient-to-r from-[#00f0ff] to-[#ffd700] text-black font-bold"
                >
                  Reservar Cita
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-[#00f0ff] transition-colors"
                  >
                    {/* Header: Avatar + Info + Status (sempre visibile) */}
                    <div className="flex items-start gap-3 mb-3">
                      {/* Barber Avatar */}
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarImage src={appointment.barber?.profileImage || undefined} />
                        <AvatarFallback className="bg-gray-700">
                          {appointment.barber?.user?.name?.charAt(0).toUpperCase() || "B"}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {appointment.service?.name || "Servicio"}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          Con {appointment.barber?.user?.name || "Barbero"}
                        </p>
                      </div>

                      {/* Status - Desktop only */}
                      <div className="hidden sm:block flex-shrink-0">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            appointment.status === "CONFIRMED"
                              ? "bg-green-500/20 text-green-400"
                              : appointment.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {appointment.status === "CONFIRMED"
                            ? "Confirmada"
                            : appointment.status === "PENDING"
                            ? "Pendiente"
                            : "Cancelada"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Date/Time + Price + Calendar Button */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Date & Time */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(appointment.date), "dd MMM yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {appointment.time}
                        </span>
                      </div>

                      {/* Status - Mobile only */}
                      <div className="sm:hidden">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            appointment.status === "CONFIRMED"
                              ? "bg-green-500/20 text-green-400"
                              : appointment.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {appointment.status === "CONFIRMED"
                            ? "✓"
                            : appointment.status === "PENDING"
                            ? "⏱"
                            : "✗"}
                        </span>
                      </div>

                      {/* Price + Calendar Button */}
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold text-[#ffd700]">
                          ${appointment.service?.price || 0}
                        </p>
                        <AddToCalendarButton
                          appointmentId={appointment.id}
                          variant="outline"
                          size="sm"
                          showText={false}
                          appointmentData={{
                            date: appointment.date,
                            time: appointment.time,
                            service: {
                              name: appointment.service?.name || 'Servicio',
                              duration: appointment.service?.duration || 60,
                            },
                            barber: {
                              name: appointment.barber?.user?.name || 'Barbero',
                              email: appointment.barber?.user?.email,
                            },
                            client: {
                              name: session?.user?.name || 'Cliente',
                              email: session?.user?.email || '',
                            },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* FAB Buttons */}
      <ShareFAB />
    </div>
  );
}
