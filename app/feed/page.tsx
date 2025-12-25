'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/i18n-context';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Calendar, 
  Scissors, 
  Star, 
  Sparkles,
  Clock,
  TrendingUp,
  ArrowRight,
  User,
  Image as ImageIcon,
  MessageCircle,
  Send
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ShareFAB } from '@/components/share-fab';
import { DashboardNavbar } from '@/components/dashboard/navbar';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    image: string | null;
    role: string;
  };
}

interface Post {
  id: string;
  caption: string;
  hashtags: string[];
  cloud_storage_path: string;
  postType: 'BARBER_WORK' | 'CLIENT_SHARE';
  authorType: 'USER' | 'BARBER';
  likes: number;
  viewCount: number;
  createdAt: string;
  author?: {
    name: string;
    image: string | null;
  };
  barber?: {
    name: string;
  };
  comments?: Comment[];
}

interface Barber {
  id: string;
  userId: string;
  bio: string | null;
  specialties: string | null;
  hourlyRate: number | null;
  rating: number | null;
  gender: 'MALE' | 'FEMALE' | 'BOTH';
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  service: {
    name: string;
    price: number;
  } | null;
  barber: {
    user: {
      name: string;
      image: string | null;
    };
  } | null;
}

export default function FeedPage() {
  const { data: session, status } = useSession() || {};
  const { t } = useI18n();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [stylists, setStylists] = useState<Barber[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState<{[key: string]: string}>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Fetch approved posts
      const postsRes = await fetch('/api/posts?status=APPROVED');
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData.posts?.slice(0, 12) || []); // Latest 12 posts
      }

      // Fetch barbers and stylists separately
      const barbersRes = await fetch('/api/barbers');
      if (barbersRes.ok) {
        const barbersData = await barbersRes.json();
        const allStaff = barbersData.barbers || [];
        
        // Separate male barbers and female stylists
        const maleBarbers = allStaff.filter((b: Barber) => b.gender === 'MALE').slice(0, 4);
        const femaleStylists = allStaff.filter((b: Barber) => b.gender === 'FEMALE').slice(0, 4);
        
        setBarbers(maleBarbers);
        setStylists(femaleStylists);
      }

      // Fetch next appointment
      const appointmentsRes = await fetch('/api/appointments?status=upcoming&limit=1');
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json();
        setNextAppointment(appointmentsData[0] || null);
      }

      // Note: Like checking removed for performance - will check on demand
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        setLikedPosts(prev => {
          const newSet = new Set(prev);
          if (data.liked) {
            newSet.add(postId);
          } else {
            newSet.delete(postId);
          }
          return newSet;
        });

        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes: data.likes } 
            : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Error liking post');
    }
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = async (postId: string) => {
    const content = commentText[postId]?.trim();
    if (!content) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content })
      });

      if (response.ok) {
        const { comment } = await response.json();
        
        // Update posts with new comment
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: [comment, ...(post.comments || [])]
            };
          }
          return post;
        }));

        // Clear comment text
        setCommentText(prev => ({ ...prev, [postId]: '' }));
        toast.success('Comentario agregado');
      } else {
        toast.error('Error al agregar comentario');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    }
  };

  const getMediaUrl = (cloud_storage_path: string) => {
    const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || 'your-bucket';
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  };

  const isVideo = (path: string) => {
    return path.match(/\\.(mp4|webm|ogg|mov)$/i);
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-[#00f0ff] flex items-center gap-3">
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Navbar con logo BookMe */}
      <DashboardNavbar />
      
      {/* Mensaje de bienvenida */}
      <div className="bg-gradient-to-b from-gray-900/50 to-transparent border-b border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 text-[#00f0ff]" />
            <h2 className="text-lg text-gray-300">
              Descubre estilos y reserva tu cita
            </h2>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions with Premium Animation */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/reservar" className="block">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="glass-cyan hover:glow-cyan smooth-transition overflow-hidden relative">
                <CardContent className="p-6 text-center relative z-10">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Calendar className="w-8 h-8 text-[#00f0ff] mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white font-semibold">{t('feed.bookAppointment')}</p>
                  <p className="text-gray-400 text-xs mt-1">{t('feed.scheduleNow')}</p>
                </CardContent>
                <div className="absolute inset-0 shimmer opacity-50" />
              </Card>
            </motion.div>
          </Link>

          <Link href="/galeria" className="block">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.05, rotate: -1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="glass-gold hover:glow-gold smooth-transition overflow-hidden relative">
                <CardContent className="p-6 text-center relative z-10">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ImageIcon className="w-8 h-8 text-[#ffd700] mx-auto mb-2" />
                  </motion.div>
                  <p className="text-white font-semibold">{t('feed.getInspired')}</p>
                  <p className="text-gray-400 text-xs mt-1">{t('feed.viewStyles')}</p>
                </CardContent>
                <div className="absolute inset-0 shimmer opacity-50" />
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* Next Appointment */}
        {nextAppointment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Próxima Cita</p>
                      <p className="text-gray-400 text-sm">
                        {nextAppointment.service?.name} - {nextAppointment.barber?.user?.name}
                      </p>
                      <p className="text-[#00f0ff] text-xs mt-1">
                        {new Date(nextAppointment.date).toLocaleDateString('es', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} a las {nextAppointment.time}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Male Barbers Section */}
        {barbers.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-[#00f0ff]" />
                {t('feed.featuredBarbers')}
              </h2>
              <Link href="/barberos">
                <Button variant="ghost" size="sm" className="text-[#00f0ff] hover:text-[#00f0ff]">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {barbers.map((barber, index) => (
                <Link key={barber.id} href={`/barberos/${barber.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.08, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card className="glass-cyan hover:glow-cyan smooth-transition overflow-hidden relative group">
                      <CardContent className="p-4 text-center">
                        <motion.div 
                          className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-[#00f0ff]/20 to-[#0099cc]/20" />
                          {barber.user.image ? (
                            <Image
                              src={barber.user.image}
                              alt={barber.user.name || 'Barber'}
                              fill
                              className="object-cover relative z-10"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center relative z-10">
                              <Scissors className="w-10 h-10 text-[#00f0ff]/50" />
                            </div>
                          )}
                        </motion.div>
                        <p className="text-white font-semibold text-sm truncate">
                          {barber.user.name || 'Barber'}
                        </p>
                        {barber.specialties && (
                          <p className="text-gray-400 text-xs truncate mt-1">
                            {barber.specialties}
                          </p>
                        )}
                        {barber.rating && barber.rating > 0 && (
                          <motion.div 
                            className="flex items-center justify-center gap-1 mt-2"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Star className="w-3 h-3 text-[#ffd700] fill-current" />
                            <span className="text-[#ffd700] text-xs font-semibold">
                              {barber.rating.toFixed(1)}
                            </span>
                          </motion.div>
                        )}
                      </CardContent>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#00f0ff]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Female Stylists Section */}
        {stylists.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                {t('feed.featuredStylists')}
              </h2>
              <Link href="/barberos">
                <Button variant="ghost" size="sm" className="text-pink-400 hover:text-pink-400">
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {stylists.map((stylist, index) => (
                <Link key={stylist.id} href={`/barberos/${stylist.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.08, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card className="glass-pink hover:glow-pink smooth-transition overflow-hidden relative group">
                      <CardContent className="p-4 text-center">
                        <motion.div 
                          className="relative w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden"
                          whileHover={{ rotate: -360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-purple-500/20" />
                          {stylist.user.image ? (
                            <Image
                              src={stylist.user.image}
                              alt={stylist.user.name || 'Stylist'}
                              fill
                              className="object-cover relative z-10"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center relative z-10">
                              <Sparkles className="w-10 h-10 text-pink-400/50" />
                            </div>
                          )}
                        </motion.div>
                        <p className="text-white font-semibold text-sm truncate">
                          {stylist.user.name || 'Stylist'}
                        </p>
                        {stylist.specialties && (
                          <p className="text-gray-400 text-xs truncate mt-1">
                            {stylist.specialties}
                          </p>
                        )}
                        {stylist.rating && stylist.rating > 0 && (
                          <motion.div 
                            className="flex items-center justify-center gap-1 mt-2"
                            whileHover={{ scale: 1.1 }}
                          >
                            <Star className="w-3 h-3 text-[#ffd700] fill-current" />
                            <span className="text-[#ffd700] text-xs font-semibold">
                              {stylist.rating.toFixed(1)}
                            </span>
                          </motion.div>
                        )}
                      </CardContent>
                      <div className="absolute inset-0 bg-gradient-to-t from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {posts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00f0ff]" />
                Community Feed
              </h2>
            </div>

            <div className="space-y-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ y: -5 }}
                >
                  <Card className="glass smooth-transition overflow-hidden relative group">
                    <CardContent className="p-0 relative z-10">
                      {/* Author Header */}
                      <div className="flex items-center gap-3 p-4">
                        <motion.div 
                          className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center"
                          whileHover={{ scale: 1.1, rotate: 180 }}
                          transition={{ duration: 0.3 }}
                        >
                          {post.author?.image ? (
                            <Image
                              src={post.author.image}
                              alt={post.author.name || 'User'}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <User className="w-5 h-5 text-white" />
                          )}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">
                            {post.authorType === 'BARBER' 
                              ? post.barber?.name 
                              : post.author?.name || 'User'}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString('en', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            {post.postType === 'BARBER_WORK' ? (
                              <motion.div 
                                className="px-2 py-0.5 bg-cyan-500/20 rounded-full"
                                whileHover={{ scale: 1.1 }}
                              >
                                <Scissors className="w-3 h-3 text-cyan-400" />
                              </motion.div>
                            ) : (
                              <motion.div 
                                className="px-2 py-0.5 bg-pink-500/20 rounded-full"
                                whileHover={{ scale: 1.1 }}
                              >
                                <User className="w-3 h-3 text-pink-400" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Media */}
                      <div className="relative w-full aspect-square bg-zinc-800">
                        {isVideo(post.cloud_storage_path) ? (
                          <video
                            src={getMediaUrl(post.cloud_storage_path)}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={getMediaUrl(post.cloud_storage_path)}
                            alt={post.caption}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 600px"
                            className="object-cover"
                            loading={index < 2 ? "eager" : "lazy"}
                            priority={index < 2}
                          />
                        )}
                      </div>

                      {/* Actions & Caption */}
                      <div className="p-4 space-y-3">
                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                          {/* Like Button with Animation */}
                          <motion.button
                            onClick={() => handleLike(post.id)}
                            className="flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <motion.div
                              animate={likedPosts.has(post.id) ? {
                                scale: [1, 1.3, 1],
                                rotate: [0, -10, 10, -10, 0]
                              } : {}}
                              transition={{ duration: 0.4 }}
                            >
                              <Heart
                                className={`w-6 h-6 smooth-transition ${
                                  likedPosts.has(post.id)
                                    ? 'fill-red-500 text-red-500'
                                    : 'text-white hover:text-red-400'
                                }`}
                              />
                            </motion.div>
                            <span className="text-white font-semibold text-sm">{post.likes} likes</span>
                          </motion.button>

                          {/* Comment Button */}
                          <motion.button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-2"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <MessageCircle className="w-6 h-6 text-white hover:text-cyan-400 smooth-transition" />
                            <span className="text-white font-semibold text-sm">
                              {post.comments?.length || 0} comentarios
                            </span>
                          </motion.button>
                        </div>

                        {/* Caption */}
                        <div>
                          <p className="text-white text-sm">
                            <span className="font-semibold mr-2">
                              {post.authorType === 'BARBER' 
                                ? post.barber?.name 
                                : post.author?.name || 'User'}
                            </span>
                            {post.caption}
                          </p>

                          {/* Hashtags */}
                          {post.hashtags && post.hashtags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {post.hashtags.map((tag, i) => (
                                <span key={i} className="text-xs text-cyan-400">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* View Count */}
                        <p className="text-xs text-zinc-500">{post.viewCount} views</p>

                        {/* Comments Section */}
                        {showComments.has(post.id) && (
                          <div className="mt-4 border-t border-zinc-700 pt-4 space-y-3">
                            {/* Comment Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Agregar un comentario..."
                                value={commentText[post.id] || ''}
                                onChange={(e) => setCommentText(prev => ({ 
                                  ...prev, 
                                  [post.id]: e.target.value 
                                }))}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                                className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                              />
                              <motion.button
                                onClick={() => handleAddComment(post.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-cyan-600 hover:to-cyan-700 smooth-transition"
                              >
                                <Send className="w-4 h-4" />
                              </motion.button>
                            </div>

                            {/* Comments List */}
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                              {post.comments && post.comments.length > 0 ? (
                                post.comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                      {comment.author.image ? (
                                        <Image
                                          src={comment.author.image}
                                          alt={comment.author.name}
                                          width={32}
                                          height={32}
                                          className="rounded-full object-cover"
                                        />
                                      ) : (
                                        <User className="w-4 h-4 text-white" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="bg-zinc-800 rounded-lg p-3">
                                        <p className="text-white font-semibold text-xs">
                                          {comment.author.name}
                                        </p>
                                        <p className="text-gray-300 text-sm mt-1">
                                          {comment.content}
                                        </p>
                                      </div>
                                      <p className="text-xs text-zinc-500 mt-1">
                                        {new Date(comment.createdAt).toLocaleDateString('es', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p className="text-center text-gray-400 text-sm py-4">
                                  No hay comentarios aún. ¡Sé el primero en comentar!
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* FAB Buttons */}
      <ShareFAB />
    </div>
  );
}
