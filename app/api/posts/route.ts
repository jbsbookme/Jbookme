import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

// GET - Fetch posts (all approved for public, or user's own posts)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const authorId = searchParams.get('authorId');

    let where: any = {};

    // If no session, only show approved posts
    if (!session) {
      where.status = 'APPROVED';
    } else {
      // If admin, can see all
      if (session.user.role === 'ADMIN') {
        if (status) {
          where.status = status;
        }
      } else {
        // Regular users see approved posts or their own
        where = {
          OR: [
            { status: 'APPROVED' },
            { authorId: session.user.id }
          ]
        };
      }
    }

    if (authorId) {
      where.authorId = authorId;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true
          }
        },
        barber: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        comments: {
          include: {
            author: {
              select: {
                name: true,
                image: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            comments: true,
            likedBy: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const hashtags = formData.get('hashtags') as string;
    const barberId = formData.get('barberId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      );
    }

    // Upload to S3
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `posts/${Date.now()}-${file.name}`;
    const cloud_storage_path = await uploadFile(buffer, key, true);

    // Determine post type
    const postType = session.user.role === 'BARBER' ? 'BARBER_WORK' : 'CLIENT_SHARE';

    // Create post
    const post = await prisma.post.create({
      data: {
        authorId: session.user.id,
        authorType: session.user.role as any,
        postType,
        cloud_storage_path,
        caption: caption || null,
        hashtags: hashtags ? hashtags.split(',').map(tag => tag.trim()) : [],
        barberId: barberId || null,
        status: 'APPROVED' // Auto-approve all posts
      },
      include: {
        author: {
          select: {
            name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
