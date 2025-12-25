'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Eye, ArrowLeft, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'BARBER_PAYMENT' | 'CLIENT_SERVICE';
  recipientName: string;
  recipientEmail: string;
  amount: number;
  description: string;
  issueDate: string;
  dueDate: string | null;
  isPaid: boolean;
  paidAt: string | null;
}

export default function FacturasPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'BARBER_PAYMENT' | 'CLIENT_SERVICE'>('ALL');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchInvoices();
  }, [session, status, router]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      } else {
        toast.error('Error al cargar facturas');
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Error al cargar facturas');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = filter === 'ALL' 
    ? invoices 
    : invoices.filter(inv => inv.type === filter);

  const getTypeBadge = (type: string) => {
    return type === 'BARBER_PAYMENT' ? (
      <Badge className="bg-purple-600">Pago Barbero</Badge>
    ) : (
      <Badge className="bg-blue-600">Servicio Cliente</Badge>
    );
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <Badge className="bg-green-600">Pagada</Badge>
    ) : (
      <Badge className="bg-yellow-600">Pendiente</Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <DashboardNavbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-white text-center">Cargando facturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <DashboardNavbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/admin')}
              className="text-gray-400 hover:text-[#00f0ff]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver
            </Button>
            <h1 className="text-4xl font-bold text-white">Facturas</h1>
          </div>
        </div>

        {/* Filtros */}
        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={() => setFilter('ALL')}
                variant={filter === 'ALL' ? 'default' : 'outline'}
                className={`${filter === 'ALL' ? 'bg-[#00f0ff] text-black' : 'text-white border-gray-700'} text-sm sm:text-base h-9 sm:h-10`}
              >
                Todas
              </Button>
              <Button
                onClick={() => setFilter('BARBER_PAYMENT')}
                variant={filter === 'BARBER_PAYMENT' ? 'default' : 'outline'}
                className={`${filter === 'BARBER_PAYMENT' ? 'bg-purple-600 text-white' : 'text-white border-gray-700'} text-sm sm:text-base h-9 sm:h-10 whitespace-nowrap`}
              >
                <span className="hidden sm:inline">Pagos de Barberos</span>
                <span className="sm:hidden">Pagos Barberos</span>
              </Button>
              <Button
                onClick={() => setFilter('CLIENT_SERVICE')}
                variant={filter === 'CLIENT_SERVICE' ? 'default' : 'outline'}
                className={`${filter === 'CLIENT_SERVICE' ? 'bg-blue-600 text-white' : 'text-white border-gray-700'} text-sm sm:text-base h-9 sm:h-10 whitespace-nowrap`}
              >
                <span className="hidden sm:inline">Servicios a Clientes</span>
                <span className="sm:hidden">Servicios</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de facturas */}
        {filteredInvoices.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No hay facturas para mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id} className="bg-gray-900 border-gray-800 hover:border-[#00f0ff] transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info principal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-[#00f0ff]" />
                        <span className="text-xl font-bold text-white">{invoice.invoiceNumber}</span>
                        {getTypeBadge(invoice.type)}
                        {getStatusBadge(invoice.isPaid)}
                      </div>
                      <p className="text-gray-400 mb-1">
                        <strong className="text-white">Destinatario:</strong> {invoice.recipientName}
                      </p>
                      <p className="text-gray-400 mb-1">
                        <strong className="text-white">Email:</strong> {invoice.recipientEmail}
                      </p>
                      <p className="text-gray-400 text-sm line-clamp-1">{invoice.description}</p>
                    </div>

                    {/* Monto y fecha */}
                    <div className="flex flex-col items-start md:items-end gap-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[#ffd700]" />
                        <span className="text-2xl font-bold text-[#ffd700]">${invoice.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(invoice.issueDate), "dd 'de' MMM, yyyy", { locale: es })}</span>
                      </div>
                      {invoice.isPaid && invoice.paidAt && (
                        <p className="text-green-500 text-sm">
                          Pagada: {format(new Date(invoice.paidAt), "dd/MM/yyyy", { locale: es })}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Link href={`/dashboard/admin/facturas/${invoice.id}`} target="_blank">
                        <Button
                          size="sm"
                          className="bg-[#00f0ff] text-black hover:bg-[#00d0df]"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-700 text-white hover:bg-gray-800"
                        onClick={() => window.open(`/dashboard/admin/facturas/${invoice.id}`, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
