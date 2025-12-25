import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  // Get user with role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { barber: true },
  });

  if (!user) {
    redirect('/login');
  }

  // Redirect based on role
  switch (user.role) {
    case 'ADMIN':
      redirect('/dashboard/admin');
    case 'BARBER':
      redirect('/dashboard/barbero');
    case 'CLIENT':
      redirect('/feed'); // Redirigir clientes al feed tipo Instagram
    default:
      redirect('/login');
  }
}
