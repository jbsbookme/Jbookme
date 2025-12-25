'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardNavbar } from '@/components/dashboard/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, Plus, Pencil, Trash2, Calendar, ArrowLeft, Check, ChevronsUpDown, ChevronDown } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface BarberPayment {
  id: string;
  barberId: string;
  amount: number;
  weekStart: string;
  weekEnd: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidAt: string | null;
  notes: string | null;
  barber: {
    id: string;
    user: {
      name: string;
      email: string;
      image: string | null;
    };
  };
}

interface Expense {
  id: string;
  category: string;
  customCategory: string | null;
  amount: number;
  description: string | null;
  date: string;
  notes: string | null;
}

interface AccountingSummary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  totalPending: number;
  pendingPaymentsCount: number;
  expensesByCategory: Array<{ category: string; total: number }>;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'BARBER_PAYMENT' | 'CLIENT_SERVICE';
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  amount: number;
  description: string;
  items: any;
  issueDate: string;
  dueDate: string | null;
  isPaid: boolean;
  paidAt: string | null;
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function ContabilidadPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [summary, setSummary] = useState<AccountingSummary | null>(null);
  const [payments, setPayments] = useState<BarberPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customCategories, setCustomCategories] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    barberId: '',
    amount: '',
    weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    weekEnd: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    status: 'PENDING',
    notes: '',
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    category: '',
    customCategory: '',
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
  });

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [openBarberCombobox, setOpenBarberCombobox] = useState(false);
  const [openUserCombobox, setOpenUserCombobox] = useState(false);
  const [useExistingRecipient, setUseExistingRecipient] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Invoice form state
  const [invoiceForm, setInvoiceForm] = useState({
    type: 'CLIENT_SERVICE',
    recipientId: '',
    recipientName: '',
    recipientEmail: '',
    amount: '',
    description: '',
    dueDate: '',
  });

  // Invoice items state
  const [invoiceItems, setInvoiceItems] = useState<Array<{description: string, quantity: number, price: number}>>([]);
  const [currentItem, setCurrentItem] = useState({description: '', quantity: 1, price: 0});
  const [savedItems, setSavedItems] = useState<Array<{id: string, description: string, price: number}>>([]);
  const [showSaveItemDialog, setShowSaveItemDialog] = useState(false);
  const [showSavedItems, setShowSavedItems] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch summary
      const summaryRes = await fetch('/api/accounting/summary');
      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        // Ensure expensesByCategory is always an array
        if (summaryData) {
          summaryData.expensesByCategory = Array.isArray(summaryData.expensesByCategory) 
            ? summaryData.expensesByCategory 
            : [];
          setSummary(summaryData);
        }
      }

      // Fetch payments
      const paymentsRes = await fetch('/api/barber-payments');
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      }

      // Fetch expenses
      const expensesRes = await fetch('/api/expenses');
      if (expensesRes.ok) {
        const expensesData = await expensesRes.json();
        setExpenses(Array.isArray(expensesData) ? expensesData : []);
      }

      // Fetch invoices
      const invoicesRes = await fetch('/api/invoices');
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      }

      // Fetch barbers
      const barbersRes = await fetch('/api/barbers');
      if (barbersRes.ok) {
        const barbersData = await barbersRes.json();
        setBarbers(Array.isArray(barbersData.barbers) ? barbersData.barbers : (Array.isArray(barbersData) ? barbersData : []));
      }

      // Fetch users (for invoice recipients)
      const usersRes = await fetch('/api/user');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      // Fetch custom expense categories
      const categoriesRes = await fetch('/api/expenses/categories');
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCustomCategories(Array.isArray(categoriesData) ? categoriesData : []);
      }

      // Fetch saved invoice items
      const savedItemsRes = await fetch('/api/invoice-items');
      if (savedItemsRes.ok) {
        const savedItemsData = await savedItemsRes.json();
        setSavedItems(Array.isArray(savedItemsData) ? savedItemsData : []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error al cargar los datos');
      // Reset to empty arrays on error
      setPayments([]);
      setExpenses([]);
      setInvoices([]);
      setBarbers([]);
      setUsers([]);
      setCustomCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/barber-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      if (res.ok) {
        toast.success('Pago registrado exitosamente');
        setShowPaymentDialog(false);
        setPaymentForm({
          barberId: '',
          amount: '',
          weekStart: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          weekEnd: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          status: 'PENDING',
          notes: '',
        });
        fetchData();
      } else {
        toast.error('Error al registrar el pago');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Error al registrar el pago');
    }
  };

  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/barber-payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success('Estado actualizado');
        fetchData();
      } else {
        toast.error('Error al actualizar el estado');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build expense data with proper custom category handling
    const expenseData = {
      ...expenseForm,
      // If category is OTHER and customCategory is '__new__', use the newCategoryInput value
      customCategory: expenseForm.category === 'OTHER' 
        ? (expenseForm.customCategory === '__new__' ? newCategoryInput : expenseForm.customCategory)
        : '',
    };

    // Validate custom category
    if (expenseData.category === 'OTHER' && !expenseData.customCategory) {
      toast.error('Por favor ingresa el nombre de la categoría personalizada');
      return;
    }
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (res.ok) {
        toast.success('Gasto registrado exitosamente');
        setShowExpenseDialog(false);
        setExpenseForm({
          category: '',
          customCategory: '',
          amount: '',
          description: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
        });
        setNewCategoryInput('');
        fetchData();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error al registrar el gasto');
      }
    } catch (error) {
      console.error('Error creating expense:', error);
      toast.error('Error al registrar el gasto');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;

    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast.success('Gasto eliminado');
        fetchData();
      } else {
        toast.error('Error al eliminar el gasto');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Error al eliminar el gasto');
    }
  };

  const handleToggleInvoicePayment = async (invoiceId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'pagada' : 'pendiente';
    
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isPaid: newStatus,
          paidAt: newStatus ? new Date().toISOString() : null
        }),
      });

      if (res.ok) {
        toast.success(`Factura marcada como ${action}`);
        fetchData();
      } else {
        toast.error('Error al actualizar el estado de la factura');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      toast.error('Error al actualizar el estado de la factura');
    }
  };

  const handleAddItem = () => {
    if (!currentItem.description || !currentItem.description.trim()) {
      toast.error('Por favor ingresa una descripción para el ítem');
      return;
    }
    if (!currentItem.price || currentItem.price <= 0) {
      toast.error('Por favor ingresa un precio válido (mayor a 0)');
      return;
    }
    if (!currentItem.quantity || currentItem.quantity < 1) {
      toast.error('La cantidad debe ser al menos 1');
      return;
    }
    
    const newItem = {
      description: currentItem.description.trim(),
      quantity: currentItem.quantity,
      price: currentItem.price
    };
    
    setInvoiceItems([...invoiceItems, newItem]);
    setCurrentItem({description: '', quantity: 1, price: 0});
    toast.success('Ítem agregado correctamente');
  };

  const handleRemoveItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  // Agregar ítem predefinido al formulario
  const handleAddSavedItem = (savedItem: {id: string, description: string, price: number}) => {
    const newItem = {
      description: savedItem.description,
      quantity: 1,
      price: savedItem.price
    };
    setInvoiceItems([...invoiceItems, newItem]);
    toast.success('Ítem agregado');
  };

  // Guardar ítem actual como predefinido
  const handleSaveAsTemplate = async () => {
    if (!currentItem.description || !currentItem.description.trim()) {
      toast.error('Agrega una descripción primero');
      return;
    }
    if (!currentItem.price || currentItem.price <= 0) {
      toast.error('Agrega un precio válido primero');
      return;
    }

    try {
      const res = await fetch('/api/invoice-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: currentItem.description.trim(),
          price: currentItem.price
        }),
      });

      if (res.ok) {
        const newItem = await res.json();
        setSavedItems([...savedItems, newItem]);
        toast.success('Ítem guardado para usar después');
        setShowSaveItemDialog(false);
      } else {
        toast.error('Error al guardar el ítem');
      }
    } catch (error) {
      console.error('Error saving item template:', error);
      toast.error('Error al guardar el ítem');
    }
  };

  // Eliminar ítem predefinido
  const handleDeleteSavedItem = async (id: string) => {
    try {
      const res = await fetch(`/api/invoice-items?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSavedItems(savedItems.filter(item => item.id !== id));
        toast.success('Ítem eliminado');
      } else {
        toast.error('Error al eliminar el ítem');
      }
    } catch (error) {
      console.error('Error deleting item template:', error);
      toast.error('Error al eliminar el ítem');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (useExistingRecipient) {
      if (!invoiceForm.recipientId) {
        toast.error('Por favor selecciona un destinatario');
        return;
      }
    } else {
      if (!invoiceForm.recipientName || !invoiceForm.recipientEmail) {
        toast.error('Por favor completa el nombre y el email del destinatario');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(invoiceForm.recipientEmail)) {
        toast.error('Por favor ingresa un email válido');
        return;
      }
    }

    if (invoiceItems.length === 0) {
      toast.error('Por favor agrega al menos un ítem a la factura');
      return;
    }
    
    const total = calculateTotal();
    
    // Preparar los datos de la factura
    const invoiceData: any = {
      type: invoiceForm.type,
      amount: total,
      items: invoiceItems,
      description: invoiceForm.description || 'Factura de servicio',
      dueDate: invoiceForm.dueDate || null,
    };

    // Solo incluir recipientId si estamos usando un destinatario existente
    if (useExistingRecipient) {
      invoiceData.recipientId = invoiceForm.recipientId;
    } else {
      // Para nuevos destinatarios, enviar nombre y email
      invoiceData.recipientName = invoiceForm.recipientName;
      invoiceData.recipientEmail = invoiceForm.recipientEmail;
    }
    
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });

      if (res.ok) {
        const invoice = await res.json();
        toast.success('Factura creada exitosamente');
        setShowInvoiceDialog(false);
        setInvoiceForm({
          type: 'CLIENT_SERVICE',
          recipientId: '',
          recipientName: '',
          recipientEmail: '',
          amount: '',
          description: '',
          dueDate: '',
        });
        setInvoiceItems([]);
        setCurrentItem({description: '', quantity: 1, price: 0});
        setUseExistingRecipient(false);
        fetchData();
        
        // Ask if they want to send via email
        if (confirm('¿Deseas enviar esta factura por email?')) {
          const emailRes = await fetch(`/api/invoices/${invoice.id}/send`, {
            method: 'POST',
          });
          if (emailRes.ok) {
            toast.success('Factura enviada por email');
          } else {
            toast.error('Error al enviar el email');
          }
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear la factura');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Error al crear la factura');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      PAID: 'default',
      PENDING: 'secondary',
      OVERDUE: 'destructive',
    };

    const labels: Record<string, string> = {
      PAID: 'Pagado',
      PENDING: 'Pendiente',
      OVERDUE: 'Vencido',
    };

    return (
      <Badge variant={variants[status]} className="capitalize">
        {labels[status]}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string, customCategory?: string | null) => {
    const labels: Record<string, string> = {
      RENT: 'Renta',
      UTILITIES_WATER: 'Agua',
      UTILITIES_ELECTRICITY: 'Electricidad',
      SUPPLIES: 'Suministros',
      MAINTENANCE: 'Mantenimiento',
      MARKETING: 'Marketing',
      SALARIES: 'Salarios',
      OTHER: 'Otros',
    };
    
    // Si es "OTHER" y hay customCategory, mostrar la categoría personalizada
    if (category === 'OTHER' && customCategory) {
      return customCategory;
    }
    
    return labels[category] || category;
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-black">
        <DashboardNavbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <DashboardNavbar />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="mb-6">
          <Button
            onClick={() => router.push('/dashboard/admin')}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Panel
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contabilidad</h1>
            <p className="text-gray-400">Gestiona los ingresos y gastos de tu barbería</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full bg-zinc-900 gap-2 p-2 h-auto">
            <TabsTrigger 
              value="resumen" 
              onClick={() => setActiveTab('resumen')} 
              className="text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="pagos" 
              onClick={() => setActiveTab('pagos')} 
              className="text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white"
            >
              <span className="hidden sm:inline">Pagos de Barberos</span>
              <span className="sm:hidden">Pagos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gastos" 
              onClick={() => setActiveTab('gastos')} 
              className="text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-700 data-[state=active]:text-white"
            >
              Gastos
            </TabsTrigger>
            <TabsTrigger 
              value="facturas" 
              onClick={() => setActiveTab('facturas')} 
              className="text-xs sm:text-sm py-3 px-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white"
            >
              Facturas
            </TabsTrigger>
          </TabsList>

          {/* Resumen Tab */}
          <TabsContent value="resumen" className="space-y-6">
            {summary && (
              <>
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card className="bg-gradient-to-br from-green-900/30 to-green-950/30 border-green-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-green-100">Ingresos Totales</CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">
                        ${summary.totalIncome.toFixed(2)}
                      </div>
                      <p className="text-xs text-green-200/60 mt-1">
                        De pagos de barberos
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-900/30 to-red-950/30 border-red-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-red-100">Gastos Totales</CardTitle>
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-400">
                        ${summary.totalExpenses.toFixed(2)}
                      </div>
                      <p className="text-xs text-red-200/60 mt-1">
                        Gastos operativos
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-900/30 to-cyan-950/30 border-cyan-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-cyan-100">Balance</CardTitle>
                      <Wallet className="h-4 w-4 text-cyan-400" />
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                        ${summary.balance.toFixed(2)}
                      </div>
                      <p className="text-xs text-cyan-200/60 mt-1">
                        Ingresos - Gastos
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-950/30 border-yellow-800/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-yellow-100">Pendiente</CardTitle>
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-400">
                        ${summary.totalPending.toFixed(2)}
                      </div>
                      <p className="text-xs text-yellow-200/60 mt-1">
                        {summary.pendingPaymentsCount} pagos pendientes
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Expenses by Category */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white">Gastos por Categoría</CardTitle>
                    <CardDescription className="text-gray-400">
                      Distribución de gastos operativos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.isArray(summary.expensesByCategory) && summary.expensesByCategory.map((item) => (
                        <div key={item.category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                            <span className="text-gray-300">{getCategoryLabel(item.category)}</span>
                          </div>
                          <span className="font-semibold text-white">${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                      {(!summary.expensesByCategory || summary.expensesByCategory.length === 0) && (
                        <p className="text-gray-500 text-center py-8">No hay gastos registrados</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Pagos de Barberos Tab */}
          <TabsContent value="pagos" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Pago
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Registrar Pago de Barbero</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Registra el pago semanal de un barbero
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreatePayment} className="space-y-4">
                    <div>
                      <Label htmlFor="barberId" className="text-gray-300">Barbero</Label>
                      <Popover open={openBarberCombobox} onOpenChange={setOpenBarberCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openBarberCombobox}
                            className="w-full justify-between bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                          >
                            {paymentForm.barberId
                              ? (() => {
                                  const selectedBarber = Array.isArray(barbers) ? barbers.find((barber) => barber?.id === paymentForm.barberId) : null;
                                  return selectedBarber?.user?.name || "Seleccionar barbero";
                                })()
                              : "Seleccionar barbero"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 bg-zinc-800 border-zinc-700">
                          <Command className="bg-zinc-800">
                            <CommandInput placeholder="Buscar barbero..." className="text-white" />
                            <CommandEmpty className="text-gray-400 py-6 text-center">No se encontró el barbero.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-auto">
                              {Array.isArray(barbers) && barbers.length > 0 ? (
                                barbers
                                  .filter(barber => barber && barber.user && barber.id)
                                  .map((barber) => (
                                    <CommandItem
                                      key={barber.id}
                                      value={barber.user?.name || ''}
                                      onSelect={() => {
                                        setPaymentForm({ ...paymentForm, barberId: barber.id });
                                        setOpenBarberCombobox(false);
                                      }}
                                      className="text-white hover:bg-zinc-700"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          paymentForm.barberId === barber.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {barber.user?.name || 'Sin nombre'}
                                    </CommandItem>
                                  ))
                              ) : (
                                <div className="py-6 text-center text-gray-400">No hay barberos disponibles</div>
                              )}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label htmlFor="amount" className="text-gray-300">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="weekStart" className="text-gray-300">Inicio de Semana</Label>
                        <Input
                          id="weekStart"
                          type="date"
                          value={paymentForm.weekStart}
                          onChange={(e) => setPaymentForm({ ...paymentForm, weekStart: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="weekEnd" className="text-gray-300">Fin de Semana</Label>
                        <Input
                          id="weekEnd"
                          type="date"
                          value={paymentForm.weekEnd}
                          onChange={(e) => setPaymentForm({ ...paymentForm, weekEnd: e.target.value })}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-gray-300">Estado</Label>
                      <Select
                        value={paymentForm.status}
                        onValueChange={(value) => setPaymentForm({ ...paymentForm, status: value })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="PENDING" className="text-white">Pendiente</SelectItem>
                          <SelectItem value="PAID" className="text-white">Pagado</SelectItem>
                          <SelectItem value="OVERDUE" className="text-white">Vencido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-gray-300">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Notas adicionales..."
                        value={paymentForm.notes}
                        onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                        Registrar Pago
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Pagos de Barberos</CardTitle>
                <CardDescription className="text-gray-400">
                  Historial de pagos semanales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(payments) && payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-white">{payment.barber.user.name}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(payment.weekStart), 'dd MMM', { locale: es })} - {format(new Date(payment.weekEnd), 'dd MMM yyyy', { locale: es })}
                          </span>
                          <span className="flex items-center">
                            <DollarSign className="mr-1 h-3 w-3" />
                            ${payment.amount.toFixed(2)}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-gray-500 mt-2">{payment.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {payment.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdatePaymentStatus(payment.id, 'PAID')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Marcar Pagado
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(payments) || payments.length === 0) && (
                    <p className="text-center text-gray-400 py-8">
                      No hay pagos registrados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gastos Tab */}
          <TabsContent value="gastos" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Registrar Gasto
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Registrar Gasto</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Registra un nuevo gasto operativo
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateExpense} className="space-y-4">
                    <div>
                      <Label htmlFor="category" className="text-gray-300">Categoría</Label>
                      <Select
                        value={expenseForm.category}
                        onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value, customCategory: value === 'OTHER' ? expenseForm.customCategory : '' })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue placeholder="Seleccionar categoría" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="RENT" className="text-white">Renta</SelectItem>
                          <SelectItem value="UTILITIES_WATER" className="text-white">Agua</SelectItem>
                          <SelectItem value="UTILITIES_ELECTRICITY" className="text-white">Electricidad</SelectItem>
                          <SelectItem value="SUPPLIES" className="text-white">Suministros</SelectItem>
                          <SelectItem value="MAINTENANCE" className="text-white">Mantenimiento</SelectItem>
                          <SelectItem value="MARKETING" className="text-white">Marketing</SelectItem>
                          <SelectItem value="SALARIES" className="text-white">Salarios</SelectItem>
                          <SelectItem value="OTHER" className="text-white">Otros (Personalizar)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Category Input - Only shows when OTHER is selected */}
                    {expenseForm.category === 'OTHER' && (
                      <div>
                        <Label htmlFor="customCategory" className="text-gray-300">Categoría Personalizada</Label>
                        {customCategories.length > 0 ? (
                          <div className="space-y-2">
                            <Select
                              value={expenseForm.customCategory}
                              onValueChange={(value) => setExpenseForm({ ...expenseForm, customCategory: value })}
                            >
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                                <SelectValue placeholder="Seleccionar o escribir nueva..." />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="__new__" className="text-cyan-400 font-semibold">+ Crear nueva categoría</SelectItem>
                                {Array.isArray(customCategories) && customCategories.length > 0 ? (
                                  customCategories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.name} className="text-white">
                                      {cat.name}
                                    </SelectItem>
                                  ))
                                ) : null}
                              </SelectContent>
                            </Select>
                            {expenseForm.customCategory === '__new__' && (
                              <Input
                                type="text"
                                placeholder="Nombre de la nueva categoría..."
                                value={newCategoryInput}
                                onChange={(e) => setNewCategoryInput(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white"
                                required
                                autoFocus
                              />
                            )}
                          </div>
                        ) : (
                          <Input
                            id="customCategory"
                            type="text"
                            placeholder="Ej: Reparación de equipos, Publicidad online, etc."
                            value={expenseForm.customCategory}
                            onChange={(e) => setExpenseForm({ ...expenseForm, customCategory: e.target.value })}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                          />
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="amount" className="text-gray-300">Monto</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="date" className="text-gray-300">Fecha</Label>
                      <Input
                        id="date"
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-gray-300">Descripción</Label>
                      <Input
                        id="description"
                        placeholder="Descripción del gasto"
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-gray-300">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Notas adicionales..."
                        value={expenseForm.notes}
                        onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                        Registrar Gasto
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Gastos Operativos</CardTitle>
                <CardDescription className="text-gray-400">
                  Historial de todos los gastos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(expenses) && expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-cyan-500/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-white">{getCategoryLabel(expense.category, expense.customCategory)}</h3>
                          <Badge variant="outline" className="text-gray-400">
                            ${expense.amount.toFixed(2)}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            {format(new Date(expense.date), 'dd MMM yyyy', { locale: es })}
                          </span>
                          {expense.description && (
                            <span>{expense.description}</span>
                          )}
                        </div>
                        {expense.notes && (
                          <p className="text-xs text-gray-500 mt-2">{expense.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(expenses) || expenses.length === 0) && (
                    <p className="text-center text-gray-400 py-8">
                      No hay gastos registrados
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facturas Tab */}
          <TabsContent value="facturas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Factura
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto max-w-3xl">
                  <DialogHeader className="sticky top-0 bg-zinc-900 z-10 pb-4">
                    <DialogTitle className="text-white">Crear Factura</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Genera una factura para un cliente o barbero
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateInvoice} className="space-y-4 px-1">
                    <div>
                      <Label htmlFor="type" className="text-gray-300">Tipo de Factura</Label>
                      <Select
                        value={invoiceForm.type}
                        onValueChange={(value) => setInvoiceForm({ ...invoiceForm, type: value })}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                          <SelectItem value="CLIENT_SERVICE" className="text-white">Servicio a Cliente</SelectItem>
                          <SelectItem value="BARBER_PAYMENT" className="text-white">Pago de Barbero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Toggle between new recipient and existing user */}
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id="useExistingRecipient"
                        checked={useExistingRecipient}
                        onChange={(e) => setUseExistingRecipient(e.target.checked)}
                        className="w-4 h-4 text-cyan-600 bg-zinc-900 border-zinc-700 rounded focus:ring-cyan-600"
                      />
                      <Label htmlFor="useExistingRecipient" className="text-gray-300">
                        Usar usuario existente
                      </Label>
                    </div>

                    {useExistingRecipient ? (
                      <div>
                        <Label htmlFor="recipientId" className="text-gray-300">Destinatario</Label>
                        <Popover open={openUserCombobox} onOpenChange={setOpenUserCombobox}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openUserCombobox}
                              className="w-full justify-between bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 hover:text-white"
                            >
                              {invoiceForm.recipientId
                                ? users.find((user) => user.id === invoiceForm.recipientId)?.name || "Seleccionar destinatario"
                                : "Seleccionar destinatario"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0 bg-zinc-800 border-zinc-700">
                            <Command className="bg-zinc-800">
                              <CommandInput placeholder="Buscar usuario..." className="text-white" />
                              <CommandEmpty className="text-gray-400 py-6 text-center">No se encontró el usuario.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-auto">
                                {Array.isArray(users) && users.map((user) => (
                                  <CommandItem
                                    key={user.id}
                                    value={`${user.name} ${user.email}`}
                                    onSelect={() => {
                                      setInvoiceForm({ ...invoiceForm, recipientId: user.id });
                                      setOpenUserCombobox(false);
                                    }}
                                    className="text-white hover:bg-zinc-700"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        invoiceForm.recipientId === user.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div>
                                      <div>{user.name}</div>
                                      <div className="text-xs text-gray-400">{user.email}</div>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label htmlFor="recipientName" className="text-gray-300">Nombre del Destinatario *</Label>
                          <Input
                            id="recipientName"
                            value={invoiceForm.recipientName}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, recipientName: e.target.value })}
                            placeholder="Ej: Juan Pérez"
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                        <div>
                          <Label htmlFor="recipientEmail" className="text-gray-300">Email del Destinatario *</Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            value={invoiceForm.recipientEmail}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, recipientEmail: e.target.value })}
                            placeholder="Ej: juan@ejemplo.com"
                            className="bg-zinc-800 border-zinc-700 text-white"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="description" className="text-gray-300">Descripción (opcional)</Label>
                      <Textarea
                        id="description"
                        placeholder="Descripción general de la factura (opcional)..."
                        value={invoiceForm.description}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    {/* Items Section */}
                    <div className="border-2 border-cyan-500/50 rounded-lg p-5 space-y-4 bg-gradient-to-br from-cyan-950/20 to-zinc-900/50">
                      <div className="flex items-center justify-between border-b border-cyan-600/20 pb-3">
                        <div>
                          <Label className="text-white text-xl font-bold flex items-center gap-2">
                            <span className="text-cyan-400">📋</span>
                            Ítems de la Factura
                            <span className="text-red-400">*</span>
                          </Label>
                          <p className="text-xs text-gray-400 mt-1">
                            Agrega los productos o servicios que componen esta factura
                          </p>
                        </div>
                        <Badge variant="outline" className="text-sm text-cyan-400 border-cyan-400 px-3 py-1">
                          {invoiceItems.length} {invoiceItems.length === 1 ? 'ítem' : 'ítems'}
                        </Badge>
                      </div>

                      {/* Saved Items - Ítems Guardados */}
                      {savedItems.length > 0 && (
                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-500/30 space-y-3">
                          {/* Header - Always visible */}
                          <button
                            type="button"
                            onClick={() => setShowSavedItems(!showSavedItems)}
                            className="w-full flex items-center justify-between p-4 hover:bg-purple-900/10 transition-colors rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xl">💾</span>
                              <Label className="text-purple-400 font-semibold cursor-pointer">Ítems Guardados - Click para Agregar</Label>
                              <Badge variant="outline" className="text-xs text-purple-300 border-purple-400">
                                {savedItems.length} guardados
                              </Badge>
                            </div>
                            <ChevronDown 
                              className={`h-5 w-5 text-purple-400 transition-transform duration-200 ${showSavedItems ? 'rotate-180' : ''}`}
                            />
                          </button>
                          
                          {/* Content - Collapsible */}
                          {showSavedItems && (
                            <div className="px-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {savedItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="group bg-zinc-800/50 hover:bg-zinc-800 rounded-lg p-3 border border-zinc-700 hover:border-purple-500/50 transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div 
                                        onClick={() => handleAddSavedItem(item)}
                                        className="flex-1"
                                      >
                                        <p className="text-white font-medium text-sm line-clamp-1">{item.description}</p>
                                        <p className="text-cyan-400 text-xs font-bold">${item.price.toFixed(2)}</p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteSavedItem(item.id)}
                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Eliminar ítem guardado"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 italic flex items-center gap-1">
                                <span>💡</span>
                                Click en un ítem para agregarlo a la factura. Pasa el mouse para ver el botón de eliminar.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Add Item Form - Destacado */}
                      <div className="bg-zinc-800 rounded-lg p-4 border border-cyan-600/40 space-y-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-cyan-400" />
                            <Label className="text-cyan-400 font-semibold">Agregar Nuevo Ítem</Label>
                          </div>
                          {currentItem.description && currentItem.price > 0 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={handleSaveAsTemplate}
                              className="text-xs text-purple-400 border-purple-500 hover:bg-purple-900/30"
                            >
                              💾 Guardar para después
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-6">
                            <Label className="text-gray-300 mb-2 block font-medium">
                              Descripción <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              placeholder="Ej: Corte de cabello premium"
                              value={currentItem.description}
                              onChange={(e) => setCurrentItem({ ...currentItem, description: e.target.value })}
                              className="bg-zinc-900 border-zinc-600 text-white focus:border-cyan-500 focus:ring-cyan-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddItem();
                                }
                              }}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-gray-300 mb-2 block font-medium">
                              Cantidad
                            </Label>
                            <Input
                              type="number"
                              placeholder="1"
                              min="1"
                              value={currentItem.quantity || ''}
                              onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
                              className="bg-zinc-900 border-zinc-600 text-white focus:border-cyan-500 focus:ring-cyan-500"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-gray-300 mb-2 block font-medium">
                              Precio Unitario <span className="text-red-400">*</span>
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              value={currentItem.price || ''}
                              onChange={(e) => setCurrentItem({ ...currentItem, price: parseFloat(e.target.value) || 0 })}
                              className="bg-zinc-900 border-zinc-600 text-white focus:border-cyan-500 focus:ring-cyan-500"
                            />
                          </div>
                          <div className="md:col-span-1 flex items-end">
                            <Button
                              type="button"
                              onClick={handleAddItem}
                              className="bg-cyan-600 hover:bg-cyan-700 w-full h-10 flex items-center justify-center gap-1 font-semibold shadow-lg shadow-cyan-600/30"
                              title="Agregar ítem"
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 italic flex items-center gap-1">
                          <span>💡</span>
                          Presiona Enter o haz clic en el botón + para agregar el ítem
                        </p>
                      </div>

                      {/* Items List */}
                      {invoiceItems.length > 0 ? (
                        <div className="space-y-3 mt-4">
                          <div className="flex items-center gap-2 px-2">
                            <Label className="text-gray-300 font-semibold">Ítems Agregados:</Label>
                          </div>
                          
                          <div className="bg-zinc-900/50 rounded-lg border border-zinc-700/50 overflow-hidden">
                            <div className="grid grid-cols-12 gap-3 text-xs text-cyan-400 font-bold uppercase px-4 py-3 bg-zinc-800/50 border-b border-zinc-700">
                              <div className="col-span-6">Descripción</div>
                              <div className="col-span-2 text-center">Cantidad</div>
                              <div className="col-span-3 text-right">Precio Unit.</div>
                              <div className="col-span-1"></div>
                            </div>
                            {invoiceItems.map((item, index) => (
                              <div key={index} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0">
                                <div className="col-span-6 text-white font-medium">{item.description}</div>
                                <div className="col-span-2 text-center">
                                  <Badge variant="outline" className="border-zinc-600 text-white">
                                    {item.quantity}x
                                  </Badge>
                                </div>
                                <div className="col-span-3 text-right">
                                  <div className="flex flex-col items-end">
                                    <span className="text-xs text-gray-400">${item.price.toFixed(2)} c/u</span>
                                    <span className="text-white font-bold text-sm">
                                      ${(item.quantity * item.price).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                                <div className="col-span-1 flex justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-2 h-auto rounded-md transition-all"
                                    title="Eliminar ítem"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Total destacado */}
                          <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/20 rounded-lg p-4 border border-cyan-600/40">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-300 text-lg font-semibold">Total de la Factura:</span>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-cyan-400">
                                  ${calculateTotal().toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {invoiceItems.length} {invoiceItems.length === 1 ? 'ítem' : 'ítems'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-zinc-900/30 rounded-lg border-2 border-dashed border-zinc-700">
                          <div className="flex flex-col items-center gap-2">
                            <div className="text-4xl mb-2">📝</div>
                            <p className="text-gray-400 font-medium">
                              No hay ítems agregados todavía
                            </p>
                            <p className="text-gray-500 text-sm">
                              Agrega al menos un ítem usando el formulario arriba
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dueDate" className="text-gray-300">Fecha de Vencimiento (opcional)</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={invoiceForm.dueDate}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                        className="bg-zinc-800 border-zinc-700 text-white"
                      />
                    </div>

                    <DialogFooter className="sticky bottom-0 bg-zinc-900 pt-4 mt-4 border-t border-zinc-800">
                      <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 w-full">
                        Crear Factura
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Facturas Generadas</CardTitle>
                <CardDescription className="text-gray-400">
                  Lista de todas las facturas creadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(invoices) && invoices.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:border-cyan-500/50 transition-colors gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-white text-sm sm:text-base">{invoice.invoiceNumber}</h3>
                          <Badge variant={invoice.isPaid ? 'default' : 'secondary'} className={invoice.isPaid ? 'bg-green-600' : ''}>
                            {invoice.isPaid ? 'Pagada' : 'Pendiente'}
                          </Badge>
                          <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                            {invoice.type === 'CLIENT_SERVICE' ? 'Servicio' : 'Pago Barbero'}
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-400 text-xs sm:text-sm break-words">
                            <strong>Destinatario:</strong> {invoice.recipientName} ({invoice.recipientEmail})
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm break-words">
                            <strong>Descripción:</strong> {invoice.description}
                          </p>
                          <p className="text-gray-400 text-xs sm:text-sm">
                            <strong>Fecha:</strong> {format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: es })}
                            {invoice.dueDate && ` - Vence: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: es })}`}
                          </p>
                          {invoice.isPaid && invoice.paidAt && (
                            <p className="text-green-400 text-xs sm:text-sm">
                              <strong>Pagada el:</strong> {format(new Date(invoice.paidAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 sm:gap-2 sm:text-right shrink-0">
                        <p className="text-xl sm:text-2xl font-bold text-white whitespace-nowrap">${invoice.amount.toFixed(2)}</p>
                        <Button
                          onClick={() => handleToggleInvoicePayment(invoice.id, invoice.isPaid)}
                          variant={invoice.isPaid ? 'outline' : 'default'}
                          size="sm"
                          className={cn(
                            'whitespace-nowrap text-xs sm:text-sm',
                            invoice.isPaid 
                              ? 'border-orange-500 text-orange-400 hover:bg-orange-500/20' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          )}
                        >
                          {invoice.isPaid ? 'Marcar Pendiente' : 'Marcar Pagada'}
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(invoices) || invoices.length === 0) && (
                    <p className="text-center text-gray-400 py-8">
                      No hay facturas registradas
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
