import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Scissors, ArrowLeft, Star, Calendar, Clock, User } from 'lucide-react';

type Params = {
  params: Promise<{ id: string }>;
};

export default async function BarberProfilePage({ params }: Params) {
  const { id } = await params;

  const barber = await prisma.barber.findUnique({
    where: { id },
    include: {
      user: true,
      services: {
        where: { isActive: true },
      },
      reviews: {
        include: {
          client: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!barber) {
    notFound();
  }

  const totalRating = barber.reviews.reduce((sum, review) => sum + review.rating, 0);
  const avgRating = barber.reviews.length > 0 ? totalRating / barber.reviews.length : 0;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-[#0a0a0a]/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 max-w-7xl">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-[#00f0ff] to-[#0099cc] p-2 rounded-lg">
              <Scissors className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold text-white">
              Book<span className="text-[#00f0ff]">Me</span>
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/barberos">
              <Button variant="ghost" className="text-gray-300 hover:text-[#00f0ff]">
                <ArrowLeft className="w-5 h-5 mr-2" />
                View Barbers
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-[#0a0a0a] hover:text-[#00f0ff]">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-12">
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-gradient-to-br from-[#00f0ff]/10 to-[#0099cc]/10">
                    {barber.profileImage || barber.user?.image ? (
                      <img
                        src={barber.profileImage || barber.user?.image || ''}
                        alt={barber.user?.name || 'Barber'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-24 h-24 text-[#00f0ff]/30" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-2">
                    {barber.user?.name || 'Barber'}
                  </h1>
                  {barber.specialties && (
                    <p className="text-[#00f0ff] text-lg mb-4">{barber.specialties}</p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center">
                      <Star className="w-6 h-6 text-[#ffd700] fill-current mr-2" />
                      <span className="text-2xl font-bold text-[#ffd700]">
                        {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
                      </span>
                    </div>
                    <span className="text-gray-400">
                      ({barber.reviews.length} {barber.reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                    {barber.hourlyRate && (
                      <span className="text-[#00f0ff] font-semibold ml-auto">
                        ${barber.hourlyRate}/hour
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {barber.bio && (
                    <p className="text-gray-400 mb-6">{barber.bio}</p>
                  )}

                  {/* CTA Button */}
                  <Link href={`/reservar?barberId=${barber.id}`}>
                    <Button className="bg-gradient-to-r from-[#00f0ff] to-[#0099cc] text-black hover:opacity-90 neon-glow text-lg px-8">
                      <Calendar className="w-5 h-5 mr-2" />
                      Book Appointment
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-6">Services</h2>
          {barber.services.length === 0 ? (
            <p className="text-gray-400">No services available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barber.services.map((service) => (
                <Card key={service.id} className="bg-[#1a1a1a] border-gray-800 hover:border-[#00f0ff] transition-colors">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                      <span className="text-[#ffd700] font-bold text-lg">${service.price}</span>
                    </div>
                    {service.description && (
                      <p className="text-gray-400 text-sm mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {service.duration} minutes
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Reviews</h2>
          {barber.reviews.length === 0 ? (
            <Card className="bg-[#1a1a1a] border-gray-800">
              <CardContent className="py-12 text-center">
                <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No reviews yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {barber.reviews.map((review) => (
                <Card key={review.id} className="bg-[#1a1a1a] border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {review.client?.image ? (
                          <img
                            src={review.client.image}
                            alt={review.client?.name || 'Client'}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00f0ff]/20 to-[#0099cc]/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-[#00f0ff]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-white font-semibold">
                              {review.client?.name || 'Client'}
                            </h4>
                            <p className="text-gray-500 text-sm">{formatDate(review.createdAt)}</p>
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < review.rating
                                    ? 'text-[#ffd700] fill-current'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-400">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
