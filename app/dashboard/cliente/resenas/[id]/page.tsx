'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';

type Appointment = {
  id: string;
  barber: {
    id: string;
    user: {
      name: string | null;
    };
  };
  service: {
    name: string;
  };
};

export default function LeaveReviewPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const params = useParams();
  const appointmentId = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    }
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch('/api/appointments');
      const data = await response.json();
      const apt = data.appointments?.find((a: Appointment) => a.id === appointmentId);
      if (apt) {
        setAppointment(apt);
      } else {
        toast.error('Cita no encontrada');
        router.push('/dashboard/cliente');
      }
    } catch (error) {
      console.error('Error fetching appointment:', error);
      toast.error('Error al cargar la cita');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    if (!appointment) {
      toast.error('Error: cita no encontrada');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          barberId: appointment.barber.id,
          rating,
          comment: comment || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear reseña');
      }

      toast.success('¡Reseña enviada exitosamente!');
      router.push('/dashboard/cliente');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear reseña';
      console.error('Error creating review:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || !appointment) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <DashboardNavbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNavbar />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Dejar <span className="text-[#ffd700]">Reseña</span>
          </h1>
          <p className="text-gray-400">
            Comparte tu experiencia con {appointment.barber?.user?.name || 'el barbero'}
          </p>
        </div>

        <Card className="bg-[#1a1a1a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Tu Opinión es Importante</CardTitle>
            <CardDescription className="text-gray-400">
              Servicio: {appointment.service?.name || 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-3">
                <Label className="text-gray-300 text-lg">Calificación *</Label>
                <div className="flex items-center justify-center gap-2 py-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-12 h-12 transition-colors ${
                          star <= (hoveredRating || rating)
                            ? 'text-[#ffd700] fill-current'
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-[#ffd700] font-semibold">
                    {rating === 1 && 'Muy malo'}
                    {rating === 2 && 'Malo'}
                    {rating === 3 && 'Regular'}
                    {rating === 4 && 'Bueno'}
                    {rating === 5 && '¡Excelente!'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="space-y-2">
                <Label htmlFor="comment" className="text-gray-300">
                  Comentario (opcional)
                </Label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={5}
                  placeholder="Cuéntanos sobre tu experiencia..."
                  className="w-full px-4 py-3 bg-[#0a0a0a] border border-gray-700 rounded-md text-white focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] outline-none resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || rating === 0}
                className="w-full bg-gradient-to-r from-[#ffd700] to-[#ffb700] text-black hover:opacity-90 gold-glow text-lg py-6"
              >
                {loading ? (
                  'Enviando...'
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Enviar Reseña
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
