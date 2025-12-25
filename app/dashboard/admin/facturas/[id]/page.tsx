'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Printer, Download, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'BARBER_PAYMENT' | 'CLIENT_SERVICE';
  issuerName: string;
  issuerAddress: string;
  issuerPhone: string;
  issuerEmail: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone: string;
  amount: number;
  description: string;
  items: any;
  issueDate: string;
  dueDate: string | null;
  isPaid: boolean;
  paidAt: string | null;
  barberPayment?: any;
  appointment?: any;
}

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string);
    }
  }, [params.id]);

  const fetchInvoice = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/invoices/${id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
      } else {
        toast.error('Error al cargar factura');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Error al cargar factura');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Cargando factura...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Factura no encontrada</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Botones de acción - ocultos al imprimir */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-3 flex flex-wrap gap-2 justify-end">
          <Button 
            onClick={() => router.push('/dashboard/admin/facturas')} 
            variant="outline" 
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Volver</span>
          </Button>
          <Button 
            onClick={handlePrint} 
            size="sm"
            className="bg-gray-800 text-white hover:bg-gray-900"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          <Button 
            onClick={handlePrint} 
            variant="outline" 
            size="sm"
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Descargar PDF</span>
          </Button>
        </div>
      </div>

      {/* Factura imprimible */}
      <div className="max-w-4xl mx-auto p-8 md:p-12 bg-white">
        {/* Header */}
        <div className="border-b-4 border-[#00f0ff] pb-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{invoice.issuerName}</h1>
              {invoice.issuerAddress && <p className="text-gray-600">{invoice.issuerAddress}</p>}
              {invoice.issuerPhone && <p className="text-gray-600">Tel: {invoice.issuerPhone}</p>}
              {invoice.issuerEmail && <p className="text-gray-600">Email: {invoice.issuerEmail}</p>}
            </div>
            <div className="text-right">
              <div className="inline-block bg-[#00f0ff] text-black px-6 py-3 rounded-lg mb-3">
                <p className="text-sm font-semibold">FACTURA</p>
                <p className="text-2xl font-bold">{invoice.invoiceNumber}</p>
              </div>
              <p className="text-gray-600 text-sm">
                Fecha: {format(new Date(invoice.issueDate), "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
              {invoice.dueDate && (
                <p className="text-gray-600 text-sm">
                  Vencimiento: {format(new Date(invoice.dueDate), "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Destinatario */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Facturar a:</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-900">{invoice.recipientName}</p>
            <p className="text-gray-600">{invoice.recipientEmail}</p>
            {invoice.recipientPhone && <p className="text-gray-600">Tel: {invoice.recipientPhone}</p>}
          </div>
        </div>

        {/* Tipo de factura */}
        <div className="mb-6">
          <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
            {invoice.type === 'BARBER_PAYMENT' ? 'Pago de Barbero' : 'Servicio a Cliente'}
          </span>
        </div>

        {/* Descripción y detalles */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Descripción:</h2>
          <p className="text-gray-700 mb-6">{invoice.description}</p>

          {/* Tabla de items si existen */}
          {invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0 && (
            <table className="w-full mb-6">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3 text-gray-900 font-semibold">Concepto</th>
                  <th className="text-right p-3 text-gray-900 font-semibold">Cantidad</th>
                  <th className="text-right p-3 text-gray-900 font-semibold">Precio Unit.</th>
                  <th className="text-right p-3 text-gray-900 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-gray-200">
                    <td className="p-3 text-gray-700">{item.description || '-'}</td>
                    <td className="text-right p-3 text-gray-700">{item.quantity || 0}</td>
                    <td className="text-right p-3 text-gray-700">${(item.unitPrice || 0).toFixed(2)}</td>
                    <td className="text-right p-3 text-gray-700">${(item.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Total */}
        <div className="border-t-2 border-gray-300 pt-6 mb-8">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900 font-semibold">${(invoice.amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-gray-300">
                <span className="text-xl font-bold text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-[#00f0ff]">${(invoice.amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de pago */}
        <div className="mb-8">
          {invoice.isPaid ? (
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4">
              <p className="text-green-800 font-semibold text-lg">✓ PAGADA</p>
              {invoice.paidAt && (
                <p className="text-green-700 text-sm">
                  Fecha de pago: {format(new Date(invoice.paidAt), "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
              <p className="text-yellow-800 font-semibold text-lg">⏱ PENDIENTE DE PAGO</p>
              {invoice.dueDate && (
                <p className="text-yellow-700 text-sm">
                  Vence: {format(new Date(invoice.dueDate), "dd 'de' MMMM, yyyy", { locale: es })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-200">
          <p>Gracias por su preferencia</p>
          <p className="mt-2">Esta es una factura electrónica generada por {invoice.issuerName}</p>
        </div>
      </div>
    </div>
  );
}
