'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, ArrowLeft, Star, Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';

interface Barber {
  id: string;
  profileImage?: string | null;
  user?: {
    name?: string | null;
    image?: string | null;
  };
  specialties?: string | null;
  bio?: string | null;
  hourlyRate?: number | null;
  avgRating: number;
  services?: any[];
  _count?: {
    reviews: number;
  };
}

export default function BarberosPage() {
  const { t } = useI18n();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const res = await fetch('/api/barbers');
      const data = await res.json();
      
      if (res.ok && data.barbers) {
        const barbersWithRatings = data.barbers.map((barber: any) => {
          const totalRating = barber.reviews?.reduce((sum: number, review: any) => sum + review.rating, 0) || 0;
          const avgRating = barber.reviews?.length > 0 ? totalRating / barber.reviews.length : 0;
          return {
            ...barber,
            avgRating: Number(avgRating.toFixed(1)),
          };
        });
        setBarbers(barbersWithRatings);
      }
    } catch (error) {
      console.error('Error fetching barbers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00f0ff]"></div>
      </div>
    );
  }

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
              {t('common.appName')} <span className="text-[#00f0ff]">{t('common.premium')}</span>
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-[#00f0ff]">
                <ArrowLeft className="w-5 h-5 mr-2" />
                {t('common.back')}
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-[#0a0a0a] hover:text-[#00f0ff]">
                {t('auth.login')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('barbers.our')} <span className="text-[#00f0ff] neon-text">{t('barbers.team')}</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {t('barbers.subtitle')}
          </p>
        </div>

        {/* Barbers Grid */}
        {barbers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">{t('barbers.noBarbers')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber, index) => (
              <Card
                key={barber.id}
                className="bg-[#1a1a1a] border-gray-800 hover:border-[#00f0ff] transition-all duration-300 group animate-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="relative w-full aspect-square mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-[#00f0ff]/10 to-[#0099cc]/10">
                    {barber.profileImage || barber.user?.image ? (
                      <img
                        src={barber.profileImage || barber.user?.image || ''}
                        alt={barber.user?.name || t('barbers.barber')}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="w-20 h-20 text-[#00f0ff]/30" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-white text-2xl">{barber.user?.name || t('barbers.barber')}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {barber.specialties || t('barbers.specialist')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-[#ffd700] fill-current" />
                      <span className="text-[#ffd700] font-semibold">
                        {barber.avgRating > 0 ? barber.avgRating.toFixed(1) : t('common.new')}
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({barber._count?.reviews || 0} {t('reviews.reviewsCount')})
                      </span>
                    </div>
                    {barber.hourlyRate && (
                      <span className="text-[#00f0ff] font-semibold">${barber.hourlyRate}/hr</span>
                    )}
                  </div>

                  {/* Bio */}
                  {barber.bio && (
                    <p className="text-gray-400 text-sm line-clamp-2">{barber.bio}</p>
                  )}

                  {/* Services Count */}
                  <div className="text-gray-500 text-sm">
                    {barber.services?.length || 0} {t('services.available')}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-2">
                    <Link href={`/reservar?barberId=${barber.id}`} className="w-full">
                      <Button className="w-full bg-gradient-to-r from-[#00f0ff] to-[#0099cc] text-black hover:opacity-90 font-bold">
                        <Calendar className="w-4 h-4 mr-2" />
                        {t('booking.bookAppointment')}
                      </Button>
                    </Link>
                    <Link href={`/barberos/${barber.id}`} className="w-full">
                      <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-[#00f0ff] hover:bg-transparent">
                        {t('barbers.viewProfile')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
