import { useState, useEffect } from 'react';
import { poultryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Utensils, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FeedRecord {
  id: number;
  batch_id: number;
  batch_name: string;
  date: string;
  feed_type: string;
  quantity_kg: number;
  cost: number | null;
  supplier: string | null;
  notes: string | null;
  recorded_by_name: string;
}

interface Batch {
  id: number;
  batch_name: string;
  status: string;
}

export function FeedRecordsTab() {
  const [records, setRecords] = useState<FeedRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    feedType: 'layers_mash',
    quantityKg: '',
    cost: '',
    supplier: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [feedRes, batchesRes] = await Promise.all([
        poultryApi.getFeed(),
        poultryApi.getBatches()
      ]);
      setRecords(feedRes.data);
      setBatches(batchesRes.data.filter((b: Batch) => b.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load feed records');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await poultryApi.createFeed({
        batchId: parseInt(formData.batchId),
        date: formData.date,
        feedType: formData.feedType,
        quantityKg: parseFloat(formData.quantityKg),
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        supplier: formData.supplier || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Feed record added successfully');
      setIsDialogOpen(false);
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        feedType: 'layers_mash',
        quantityKg: '',
        cost: '',
        supplier: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  }

  const totalFeed = records.reduce((sum, r) => sum + r.quantity_kg, 0);
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Feed Records</h2>
          <p className="text-gray-500">Track feed purchases and consumption</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Record Feed
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Feed Purchase/Usage</DialogTitle>
              <DialogDescription>Enter feed details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Batch *</Label>
                <Select value={formData.batchId} onValueChange={(value) => setFormData({ ...formData, batchId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id.toString()}>
                        {batch.batch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Feed Type *</Label>
                  <Select value={formData.feedType} onValueChange={(value) => setFormData({ ...formData, feedType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chick_mash">Chick Mash</SelectItem>
                      <SelectItem value="growers_mash">Growers Mash</SelectItem>
                      <SelectItem value="layers_mash">Layers Mash</SelectItem>
                      <SelectItem value="broiler_starter">Broiler Starter</SelectItem>
                      <SelectItem value="broiler_finisher">Broiler Finisher</SelectItem>
                      <SelectItem value="mixed">Mixed Feed</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantity (kg) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="50"
                    value={formData.quantityKg}
                    onChange={(e) => setFormData({ ...formData, quantityKg: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost (UGX)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="150000"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  placeholder="e.g., Ugachick"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={submitting || !formData.batchId}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Total Feed</p>
                <p className="text-3xl font-bold text-blue-700">{totalFeed.toLocaleString()} kg</p>
              </div>
              <Utensils className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold text-gray-700">{formatCurrency(totalCost)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Avg Cost/kg</p>
              <p className="text-2xl font-bold text-gray-700">
                {totalFeed > 0 ? formatCurrency(totalCost / totalFeed) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Utensils className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No feed records yet</h3>
            <p className="text-gray-400 mb-4">Start tracking your feed purchases</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Record
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
                  <TableHead>Batch</TableHead>
                  <TableHead>Feed Type</TableHead>
                  <TableHead className="text-right">Quantity (kg)</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.batch_name}</TableCell>
                    <TableCell className="capitalize">{record.feed_type.replace('_', ' ')}</TableCell>
                    <TableCell className="text-right font-medium">{record.quantity_kg.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{record.cost ? formatCurrency(record.cost) : '-'}</TableCell>
                    <TableCell>{record.supplier || '-'}</TableCell>
                    <TableCell>{record.recorded_by_name}</TableCell>
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

