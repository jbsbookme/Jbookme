'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, ArrowLeft, MessageSquare, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  adminResponse?: string | null;
  adminRespondedAt?: string | null;
  client: {
    name: string;
    email: string;
    image?: string;
  };
  barber: {
    name: string;
  };
}

export default function AdminResenasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/dashboard');
    } else if (status === 'authenticated') {
      fetchReviews();
    }
  }, [status, session, router]);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Error al cargar reseñas');
    } finally {
      setLoading(false);
    }
  };

  const openResponseDialog = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.adminResponse || '');
    setIsDialogOpen(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) {
      toast.error('Por favor escribe una respuesta');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/reviews/${selectedReview.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: responseText }),
      });

      if (response.ok) {
        toast.success('Respuesta publicada exitosamente');
        setIsDialogOpen(false);
        setResponseText('');
        fetchReviews();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al publicar respuesta');
      }
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('Error al publicar respuesta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteResponse = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Respuesta eliminada exitosamente');
        fetchReviews();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Error al eliminar respuesta');
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      toast.error('Error al eliminar respuesta');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? 'fill-[#ffd700] text-[#ffd700]'
                : 'fill-gray-700 text-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <DashboardNavbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
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

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Gestión de <span className="text-[#00f0ff]">Reseñas</span>
          </h1>
          <p className="text-gray-400">Responde a las reseñas de tus clientes</p>
        </div>

        {/* Info about Google Reviews */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <MessageSquare className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Integración con Google Reviews
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  Para conectar con Google My Business y sincronizar reseñas de Google,
                  necesitas configurar la API de Google My Business. Esto requiere:
                </p>
                <ul className="text-gray-400 text-sm space-y-1 ml-4">
                  <li>• Cuenta de Google My Business verificada</li>
                  <li>• Proyecto en Google Cloud Console</li>
                  <li>• API de Google My Business habilitada</li>
                  <li>• Credenciales OAuth 2.0 configuradas</li>
                </ul>
                <p className="text-gray-500 text-xs mt-3">
                  Contacta con tu desarrollador para implementar esta integración.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {reviews.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="py-12 text-center">
              <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay reseñas aún</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card
                key={review.id}
                className="bg-[#1a1a1a] border-gray-800 hover:border-[#00f0ff]/50 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[#00f0ff]/20 to-[#0099cc]/20 flex items-center justify-center flex-shrink-0">
                        {review.client.image ? (
                          <img
                            src={review.client.image}
                            alt={review.client.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-[#00f0ff]/50" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{review.client.name}</h3>
                        <p className="text-sm text-gray-400">Barbero: {review.barber.name}</p>
                        <div className="flex items-center gap-3 mt-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {review.comment && (
                    <div className="mb-4 pl-16">
                      <p className="text-gray-300 text-sm">"{review.comment}"</p>
                    </div>
                  )}

                  {/* Admin Response Section */}
                  {review.adminResponse ? (
                    <div className="mt-4 pl-16 border-l-2 border-[#00f0ff]/30">
                      <div className="pl-4 bg-[#00f0ff]/5 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-semibold text-[#00f0ff]">
                            Respuesta del administrador
                          </p>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openResponseDialog(review)}
                              variant="outline"
                              size="sm"
                              className="border-gray-700 text-gray-300 hover:bg-gray-800 h-7 text-xs"
                            >
                              Editar
                            </Button>
                            <Button
                              onClick={() => handleDeleteResponse(review.id)}
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white h-7 text-xs"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{review.adminResponse}</p>
                        {review.adminRespondedAt && (
                          <p className="text-xs text-gray-500">
                            {formatDate(review.adminRespondedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 pl-16">
                      <Button
                        onClick={() => openResponseDialog(review)}
                        variant="outline"
                        className="border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Responder
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Response Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-[#00f0ff]">
              {selectedReview?.adminResponse ? 'Editar respuesta' : 'Responder reseña'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Escribe tu respuesta a la reseña de {selectedReview?.client.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="bg-[#0a0a0a] p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                </div>
                {selectedReview.comment && (
                  <p className="text-gray-300 text-sm">"{selectedReview.comment}"</p>
                )}
              </div>
            )}
            <div>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Escribe tu respuesta aquí..."
                className="bg-[#0a0a0a] border-gray-700 text-white min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsDialogOpen(false)}
              variant="outline"
              className="border-gray-700 text-gray-300"
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitResponse}
              className="bg-gradient-to-r from-[#00f0ff] to-[#0099cc] text-black hover:opacity-90"
              disabled={submitting || !responseText.trim()}
            >
              {submitting ? 'Publicando...' : 'Publicar Respuesta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
