'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { CheckCircle2, XCircle, Clock, Eye, User, Scissors, Image as ImageIcon, Video, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';

type Post = {
  id: string;
  caption: string;
  hashtags: string[];
  cloud_storage_path: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  postType: 'BARBER_WORK' | 'CLIENT_SHARE';
  authorType: 'USER' | 'BARBER';
  likes: number;
  viewCount: number;
  rejectionReason?: string;
  createdAt: string;
  author?: {
    name: string;
    email: string;
  };
  barber?: {
    name: string;
  };
};

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
};

export default function AdminModerationPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  const fetchPosts = async (status?: string) => {
    try {
      const url = status ? `/api/posts?status=${status}` : '/api/posts';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Error loading posts');
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/posts');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      const allPosts = data.posts || [];
      
      setStats({
        pending: allPosts.filter((p: Post) => p.status === 'PENDING').length,
        approved: allPosts.filter((p: Post) => p.status === 'APPROVED').length,
        rejected: allPosts.filter((p: Post) => p.status === 'REJECTED').length,
        total: allPosts.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStats();
      await fetchPosts(activeTab === 'all' ? undefined : activeTab.toUpperCase());
      setLoading(false);
    };
    loadData();
  }, [activeTab]);

  const handleAction = async () => {
    if (!selectedPost) return;
    if (actionType === 'reject' && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);

    try {
      const res = await fetch(`/api/posts/${selectedPost.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          rejectionReason: actionType === 'reject' ? rejectionReason.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to process action');
      }

      toast.success(`Post ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data
      await fetchStats();
      await fetchPosts(activeTab === 'all' ? undefined : activeTab.toUpperCase());
      
      // Close dialog
      setActionDialogOpen(false);
      setSelectedPost(null);
      setRejectionReason('');
    } catch (error: any) {
      console.error('Error processing action:', error);
      toast.error(error.message || 'Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (post: Post, action: 'approve' | 'reject') => {
    setSelectedPost(post);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const getMediaUrl = (cloud_storage_path: string) => {
    // Assuming S3 public URLs
    const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || 'your-bucket';
    const region = process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${cloud_storage_path}`;
  };

  const isVideo = (path: string) => {
    return path.match(/\.(mp4|webm|ogg|mov)$/i);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-24">
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/dashboard/admin">
            <Button variant="outline" size="icon" className="border-gray-700 hover:border-[#00f0ff] flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Content Moderation
            </h1>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">Review and approve user-generated content</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Pending Review</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Approved</p>
                  <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Rejected</p>
                  <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Posts</p>
                  <p className="text-3xl font-bold text-cyan-400">{stats.total}</p>
                </div>
                <Eye className="w-8 h-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-zinc-900 gap-1 p-1">
            <TabsTrigger 
              value="pending" 
              onClick={() => setActiveTab('pending')}
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-xs sm:text-sm py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Pending </span>
              <span className="sm:hidden">Pend. </span>
              ({stats.pending})
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              onClick={() => setActiveTab('approved')}
              className="data-[state=active]:bg-green-500 data-[state=active]:text-black text-xs sm:text-sm py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Approved </span>
              <span className="sm:hidden">Appr. </span>
              ({stats.approved})
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              onClick={() => setActiveTab('rejected')}
              className="data-[state=active]:bg-red-500 data-[state=active]:text-black text-xs sm:text-sm py-2 sm:py-3"
            >
              <span className="hidden sm:inline">Rejected </span>
              <span className="sm:hidden">Rejec. </span>
              ({stats.rejected})
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              onClick={() => setActiveTab('all')}
              className="data-[state=active]:bg-cyan-500 data-[state=active]:text-black text-xs sm:text-sm py-2 sm:py-3"
            >
              All ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {posts.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No posts found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <Card key={post.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Media Preview */}
                      <div className="relative w-full aspect-square bg-zinc-800">
                        {isVideo(post.cloud_storage_path) ? (
                          <div className="relative w-full h-full">
                            <video
                              src={getMediaUrl(post.cloud_storage_path)}
                              controls
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 right-3 bg-black/70 rounded-full p-2">
                              <Video className="w-5 h-5 text-cyan-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-full h-full">
                            <Image
                              src={getMediaUrl(post.cloud_storage_path)}
                              alt={post.caption}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-3 right-3 bg-black/70 rounded-full p-2">
                              <ImageIcon className="w-5 h-5 text-cyan-400" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Post Info */}
                      <div className="p-4 space-y-3">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          {post.authorType === 'BARBER' ? (
                            <>
                              <Scissors className="w-4 h-4 text-cyan-400" />
                              <span className="text-sm font-semibold text-cyan-400">
                                {post.barber?.name || 'Barber'}
                              </span>
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 text-pink-400" />
                              <span className="text-sm font-semibold text-pink-400">
                                {post.author?.name || 'Client'}
                              </span>
                            </>
                          )}
                          <Badge
                            variant="outline"
                            className={`ml-auto ${
                              post.postType === 'BARBER_WORK'
                                ? 'border-cyan-500 text-cyan-400'
                                : 'border-pink-500 text-pink-400'
                            }`}
                          >
                            {post.postType === 'BARBER_WORK' ? 'Barber Work' : 'Client Share'}
                          </Badge>
                        </div>

                        {/* Caption */}
                        <p className="text-zinc-300 text-sm line-clamp-3">{post.caption}</p>

                        {/* Hashtags */}
                        {post.hashtags && post.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {post.hashtags.slice(0, 5).map((tag, i) => (
                              <span key={i} className="text-xs text-cyan-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Status */}
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800">
                          <Badge
                            className={`${
                              post.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
                                : post.status === 'APPROVED'
                                ? 'bg-green-500/20 text-green-400 border-green-500'
                                : 'bg-red-500/20 text-red-400 border-red-500'
                            }`}
                          >
                            {post.status}
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Rejection Reason */}
                        {post.status === 'REJECTED' && post.rejectionReason && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                            <p className="text-xs text-red-400">
                              <strong>Reason:</strong> {post.rejectionReason}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        {post.status === 'PENDING' && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => openActionDialog(post, 'approve')}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => openActionDialog(post, 'reject')}
                              variant="destructive"
                              className="flex-1"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {actionType === 'approve' ? 'Approve Post' : 'Reject Post'}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {actionType === 'approve'
                ? 'This post will be published and visible to all users.'
                : 'Please provide a reason for rejection. The author will be notified.'}
            </DialogDescription>
          </DialogHeader>

          {actionType === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Rejection Reason *</label>
              <Textarea
                placeholder="e.g., Content does not meet community guidelines"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-zinc-800 border-zinc-700 min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setRejectionReason('');
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
