'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Video, X, Upload, Loader2, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import Image from 'next/image';

export default function ClientUploadPage() {
  const { data: session } = useSession() || {};
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Please select an image or video file');
      return;
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setFileType(file.type.startsWith('image/') ? 'image' : 'video');

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl('');
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!caption.trim()) {
      toast.error('Please add a caption');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caption', caption.trim());
      formData.append('postType', 'CLIENT_SHARE');
      
      // Add hashtags as array
      const hashtagArray = hashtags
        .split(/[,\s]+/)
        .map(tag => tag.trim().replace(/^#/, ''))
        .filter(tag => tag.length > 0);
      formData.append('hashtags', JSON.stringify(hashtagArray));

      const res = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload post');
      }

      toast.success('Post submitted! Waiting for admin approval');
      
      // Reset form
      handleRemoveFile();
      setCaption('');
      setHashtags('');

      // Redirect to feed
      setTimeout(() => {
        router.push('/feed');
      }, 2000);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24">
      <DashboardNavbar />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              Share Your Look
            </CardTitle>
            <p className="text-zinc-400 text-sm">
              Show off your fresh cut! Admin will review before publishing.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload Area */}
              <div>
                <Label>Media</Label>
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-zinc-700 rounded-lg p-12 text-center cursor-pointer hover:border-pink-500 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-4">
                        <Camera className="w-10 h-10 text-zinc-500" />
                        <Video className="w-10 h-10 text-zinc-500" />
                      </div>
                      <p className="text-zinc-400">Click to upload photo or video</p>
                      <p className="text-xs text-zinc-600">Max size: 50MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 relative">
                    <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-800">
                      {fileType === 'image' ? (
                        <Image
                          src={previewUrl}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <video
                          src={previewUrl}
                          controls
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={handleRemoveFile}
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Caption */}
              <div>
                <Label htmlFor="caption">Caption *</Label>
                <Textarea
                  id="caption"
                  placeholder="Tell us about your experience... (e.g., 'Loving my fresh fade!')"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="mt-2 bg-zinc-800 border-zinc-700 min-h-[100px]"
                  maxLength={500}
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {caption.length}/500 characters
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <Label htmlFor="hashtags">Hashtags (Optional)</Label>
                <Input
                  id="hashtags"
                  placeholder="freshcut, barberlove, newlook (separate with spaces or commas)"
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  className="mt-2 bg-zinc-800 border-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  {hashtags.split(/[,\s]+/).filter(t => t.length > 0).length} tags
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit for Review
                    </>
                  )}
                </Button>
              </div>

              {/* Info Box */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-pink-400 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Community Guidelines
                </h4>
                <ul className="text-xs text-zinc-400 space-y-1">
                  <li>• Share your fresh looks and barber experiences</li>
                  <li>• Be respectful and positive</li>
                  <li>• Admin reviews posts within 24 hours</li>
                  <li>• You'll be notified when your post is approved</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
