'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Mail, Lock, User, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar usuario');
      }

      toast.success('¡Registro exitoso! Iniciando sesión...');

      // Auto login after signup
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.replace('/dashboard');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
      console.error('Registration error:', error);
      toast.error(errorMessage);
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
  //     toast.error('Error al registrarse con Google');
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
          <p className="text-gray-400 text-center">Crea tu cuenta de cliente</p>
        </div>

        <Card className="bg-[#1a1a1a] border-gray-800 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Crear Cuenta</CardTitle>
            <CardDescription className="text-gray-400">
              Completa el formulario para registrarte
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">
                  <User className="w-4 h-4 inline mr-2" />
                  Nombre Completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-700 text-white focus:border-[#00f0ff] focus:ring-[#00f0ff]"
                  required
                />
              </div>
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
                <Label htmlFor="phone" className="text-gray-300">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Teléfono (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-700 text-white focus:border-[#00f0ff] focus:ring-[#00f0ff]"
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
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-700 text-white focus:border-[#00f0ff] focus:ring-[#00f0ff]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirmar Contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              {/* Google SSO desactivado temporalmente - se puede reactivar más adelante */}
              {/* <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1a1a1a] px-2 text-gray-500">O regístrate con</span>
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
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-[#00f0ff] hover:underline font-semibold">
                  Inicia sesión
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
