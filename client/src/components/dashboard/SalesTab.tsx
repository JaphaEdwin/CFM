import { useState, useEffect } from 'react';
import { salesApi, customersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface Sale {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  sale_date: string;
  sale_type: 'eggs' | 'birds' | 'manure' | 'other';
  quantity: number;
  unit_price: number;
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method: string | null;
  notes: string | null;
  recorded_by_name: string;
}

interface Customer {
  id: number;
  name: string;
  phone: string;
}

export function SalesTab() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    saleDate: new Date().toISOString().split('T')[0],
    saleType: 'eggs' as const,
    quantity: '',
    unitPrice: '',
    paymentStatus: 'pending' as const,
    paymentMethod: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [salesRes, customersRes] = await Promise.all([
        salesApi.getAll(),
        customersApi.getAll()
      ]);
      setSales(salesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await salesApi.create({
        customerId: parseInt(formData.customerId),
        saleDate: formData.saleDate,
        saleType: formData.saleType,
        quantity: parseInt(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        paymentStatus: formData.paymentStatus,
        paymentMethod: formData.paymentMethod || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Sale recorded successfully');
      setIsDialogOpen(false);
      setFormData({
        customerId: '',
        saleDate: new Date().toISOString().split('T')[0],
        saleType: 'eggs',
        quantity: '',
        unitPrice: '',
        paymentStatus: 'pending',
        paymentMethod: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  }

  const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const paidRevenue = sales.filter(s => s.payment_status === 'paid').reduce((sum, s) => sum + s.total_amount, 0);
  const pendingRevenue = sales.filter(s => s.payment_status === 'pending').reduce((sum, s) => sum + s.total_amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-amber-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSaleTypeLabel = (type: string) => {
    switch (type) {
      case 'eggs': return 'Eggs (trays)';
      case 'birds': return 'Birds';
      case 'manure': return 'Manure (bags)';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Records</h2>
          <p className="text-gray-500">Track all your sales transactions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>Enter sale details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={formData.customerId} onValueChange={(value) => setFormData({ ...formData, customerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name} ({customer.phone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && (
                  <p className="text-sm text-amber-600">No customers yet. Add customers first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sale Type *</Label>
                  <Select value={formData.saleType} onValueChange={(value: any) => setFormData({ ...formData, saleType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eggs">Eggs</SelectItem>
                      <SelectItem value="birds">Birds</SelectItem>
                      <SelectItem value="manure">Manure</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="10"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unit Price (UGX) *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="15000"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    required
                  />
                </div>
              </div>

              {formData.quantity && formData.unitPrice && (
                <div className="bg-amber-50 p-3 rounded-lg">
                  <p className="text-sm text-amber-600">Total Amount</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {formatCurrency(parseInt(formData.quantity) * parseFloat(formData.unitPrice))}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payment Status</Label>
                  <Select value={formData.paymentStatus} onValueChange={(value: any) => setFormData({ ...formData, paymentStatus: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitting || !formData.customerId}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Record Sale'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Total Revenue</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalRevenue)}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="text-2xl font-bold text-gray-700">{formatCurrency(paidRevenue)}</p>
              <p className="text-xs text-amber-600">{sales.filter(s => s.payment_status === 'paid').length} transactions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(pendingRevenue)}</p>
              <p className="text-xs text-red-500">{sales.filter(s => s.payment_status === 'pending').length} transactions</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : sales.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No sales recorded yet</h3>
            <p className="text-gray-400 mb-4">Start recording your sales transactions</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Record First Sale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{sale.customer_name}</p>
                        <p className="text-xs text-gray-500">{sale.customer_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{sale.sale_type}</TableCell>
                    <TableCell className="text-right">{sale.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.unit_price)}</TableCell>
                    <TableCell className="text-right font-semibold text-amber-600">{formatCurrency(sale.total_amount)}</TableCell>
                    <TableCell>
                      <Badge className={getPaymentStatusBadge(sale.payment_status)}>
                        {sale.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.recorded_by_name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

