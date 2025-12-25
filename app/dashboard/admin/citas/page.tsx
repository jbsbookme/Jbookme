'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Clock, Filter, TrendingUp, Users, CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

type Appointment = {
  id: string;
  date: string;
  time: string;
  status: string;
  paymentMethod?: string;
  notes?: string;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  barber: {
    user: {
      name: string;
    };
  };
  service: {
    name: string;
    price: number;
    duration: number;
  };
};

type Barber = {
  id: string;
  user: {
    name: string;
  };
};

export default function AdminCitasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBarber, setSelectedBarber] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    loadData();
  }, [session, status, router]);

  const loadData = async () => {
    try {
      setLoading(true);

      const appointmentsRes = await fetch('/api/appointments');
      const appointmentsData = await appointmentsRes.json();
      setAppointments(appointmentsData.appointments || []);

      const barbersRes = await fetch('/api/barbers');
      const barbersData = await barbersRes.json();
      setBarbers(barbersData.barbers || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500/20 text-green-500';
      case 'PENDING':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'COMPLETED':
        return 'bg-blue-500/20 text-blue-500';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmada';
      case 'PENDING':
        return 'Pendiente';
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      case 'NO_SHOW':
        return 'No Asistió';
      default:
        return status;
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (selectedBarber !== 'all' && apt.barber.user.name !== selectedBarber) {
      return false;
    }
    if (selectedStatus !== 'all' && apt.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  const stats = {
    total: filteredAppointments.length,
    confirmed: filteredAppointments.filter((a) => a.status === 'CONFIRMED').length,
    pending: filteredAppointments.filter((a) => a.status === 'PENDING').length,
    completed: filteredAppointments.filter((a) => a.status === 'COMPLETED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#00f0ff]">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <Button
          onClick={() => router.push('/dashboard/admin')}
          variant="outline"
          className="border-gray-700 text-gray-300 hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Panel
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Todas las <span className="text-[#00f0ff]">Citas</span>
          </h1>
          <p className="text-gray-400 mt-1">Gestión completa de citas del sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-[#00f0ff]" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Confirmadas</p>
                <p className="text-2xl font-bold text-green-500">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completadas</p>
                <p className="text-2xl font-bold text-blue-500">{stats.completed}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-[#00f0ff] flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Barbero</label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">Todos los barberos</SelectItem>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.user.name}>
                      {barber.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Estado</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="PENDING">Pendiente</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmada</SelectItem>
                  <SelectItem value="COMPLETED">Completada</SelectItem>
                  <SelectItem value="CANCELLED">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSelectedBarber('all');
                  setSelectedStatus('all');
                }}
                variant="outline"
                className="w-full border-zinc-700 hover:bg-zinc-800"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Citas ({filteredAppointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay citas que coincidan con los filtros</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 rounded-lg border border-zinc-800 bg-black hover:border-[#00f0ff] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {appointment.client?.name || 'Cliente'}
                        </h3>
                        <span className="text-gray-500">→</span>
                        <span className="text-[#00f0ff]">
                          {appointment.barber?.user?.name || 'Barbero'}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-1">
                        {appointment.service?.name || 'Servicio'} - $
                        {appointment.service?.price || 0}
                      </p>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatDate(appointment.date)} a las {appointment.time}
                      </div>
                      {appointment.notes && (
                        <p className="text-gray-500 text-sm mt-2 italic">
                          Nota: {appointment.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {appointment.paymentMethod && (
                        <span className="text-sm text-gray-400">
                          {appointment.paymentMethod}
                        </span>
                      )}
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          getStatusColor(appointment.status)
                        }`}
                      >
                        {getStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
