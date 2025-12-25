'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else if (result?.ok) {
        toast.success('¡Bienvenido!');
        router.replace('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Google SSO desactivado - función removida temporalmente
  // const handleGoogleSignIn = async () => {
  //   try {
  //     await signIn('google', { callbackUrl: '/dashboard' });
  //   } catch (error) {
  //     console.error('Google sign-in error:', error);
  //     toast.error('Error al iniciar sesión con Google');
  //   }
  // };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md animate-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-br from-[#00f0ff] to-[#0099cc] p-4 rounded-full mb-4 neon-glow">
            <Scissors className="w-12 h-12 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Barbería <span className="text-[#00f0ff] neon-text">Premium</span>
          </h1>
          <p className="text-gray-400 text-center">Sistema de Gestión Profesional</p>
        </div>

        <Card className="bg-[#1a1a1a] border-gray-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
            <CardDescription className="text-gray-400">
              Ingresa tus credenciales para continuar
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-700 text-white focus:border-[#00f0ff] focus:ring-[#00f0ff]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-700 text-white focus:border-[#00f0ff] focus:ring-[#00f0ff]"
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#00f0ff] to-[#0099cc] text-black font-semibold hover:opacity-90 transition-all neon-glow"
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              {/* Google SSO desactivado temporalmente - se puede reactivar más adelante */}
              {/* <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1a1a1a] px-2 text-gray-500">O continuar con</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full border-gray-700 text-white hover:bg-[#0a0a0a] hover:text-[#00f0ff] transition-colors"
              >
                <Chrome className="w-5 h-5 mr-2" />
                Google
              </Button> */}

              <p className="text-center text-sm text-gray-400">
                ¿No tienes cuenta?{' '}
                <Link href="/registro" className="text-[#00f0ff] hover:underline font-semibold">
                  Regístrate aquí
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-[#00f0ff] transition-colors text-sm"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
