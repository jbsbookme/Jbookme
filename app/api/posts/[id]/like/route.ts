export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      include: {
        author: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        userId_postId: {
          userId: session.user.id,
          postId: params.id
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: {
          id: existingLike.id
        }
      });

      // Decrement like count
      await prisma.post.update({
        where: { id: params.id },
        data: {
          likes: {
            decrement: 1
          }
        }
      });

      return NextResponse.json({ 
        liked: false,
        message: 'Post unliked'
      });
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          userId: session.user.id,
          postId: params.id
        }
      });

      // Increment like count
      await prisma.post.update({
        where: { id: params.id },
        data: {
          likes: {
            increment: 1
          }
        }
      });

      // Create notification for post author (if not self-like)
      if (post.authorId !== session.user.id) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: 'POST_LIKE',
            title: 'New Like ❤️',
            message: `${session.user.name} liked your post`,
            link: `/feed`,
            postId: post.id
          }
        });
      }

      return NextResponse.json({ 
        liked: true,
        message: 'Post liked'
      });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}
