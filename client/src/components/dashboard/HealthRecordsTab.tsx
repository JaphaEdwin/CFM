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
import { Badge } from '@/components/ui/badge';
import { Plus, Heart, Loader2, AlertTriangle, Syringe, Stethoscope, Pill, Skull } from 'lucide-react';
import { toast } from 'sonner';

interface HealthRecord {
  id: number;
  batch_id: number;
  batch_name: string;
  date: string;
  record_type: 'vaccination' | 'medication' | 'checkup' | 'mortality' | 'other';
  description: string;
  mortality_count: number;
  cost: number;
  administered_by: string | null;
  notes: string | null;
  recorded_by_name: string;
}

interface Batch {
  id: number;
  batch_name: string;
  status: string;
}

export function HealthRecordsTab() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    recordType: 'vaccination' as const,
    description: '',
    mortalityCount: '0',
    cost: '',
    administeredBy: '',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [healthRes, batchesRes] = await Promise.all([
        poultryApi.getHealth(),
        poultryApi.getBatches()
      ]);
      setRecords(healthRes.data);
      setBatches(batchesRes.data.filter((b: Batch) => b.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load health records');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await poultryApi.createHealth({
        batchId: parseInt(formData.batchId),
        date: formData.date,
        recordType: formData.recordType,
        description: formData.description,
        mortalityCount: parseInt(formData.mortalityCount) || 0,
        cost: formData.cost ? parseFloat(formData.cost) : undefined,
        administeredBy: formData.administeredBy || undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Health record added successfully');
      setIsDialogOpen(false);
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        recordType: 'vaccination',
        description: '',
        mortalityCount: '0',
        cost: '',
        administeredBy: '',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  }

  const totalMortality = records.reduce((sum, r) => sum + r.mortality_count, 0);
  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vaccination': return <Syringe className="w-4 h-4" />;
      case 'medication': return <Pill className="w-4 h-4" />;
      case 'checkup': return <Stethoscope className="w-4 h-4" />;
      case 'mortality': return <Skull className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'vaccination': return 'bg-blue-100 text-blue-800';
      case 'medication': return 'bg-purple-100 text-purple-800';
      case 'checkup': return 'bg-amber-100 text-green-800';
      case 'mortality': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', { style: 'currency', currency: 'UGX', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Health Records</h2>
          <p className="text-gray-500">Track vaccinations, medications, and health events</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Health Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Health Record</DialogTitle>
              <DialogDescription>Record vaccinations, medications, or health issues</DialogDescription>
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
                  <Label>Record Type *</Label>
                  <Select value={formData.recordType} onValueChange={(value: any) => setFormData({ ...formData, recordType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vaccination">Vaccination</SelectItem>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="checkup">Checkup</SelectItem>
                      <SelectItem value="mortality">Mortality</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Input
                  placeholder="e.g., Newcastle vaccine, Gumboro booster"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mortality Count</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.mortalityCount}
                    onChange={(e) => setFormData({ ...formData, mortalityCount: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cost (UGX)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="50000"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Administered By</Label>
                <Input
                  placeholder="e.g., Dr. Mukasa"
                  value={formData.administeredBy}
                  onChange={(e) => setFormData({ ...formData, administeredBy: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={submitting || !formData.batchId}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Total Records</p>
                <p className="text-3xl font-bold text-red-700">{records.length}</p>
              </div>
              <Heart className="w-10 h-10 text-red-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total Mortality</p>
              <p className="text-3xl font-bold text-gray-700">{totalMortality.toLocaleString()}</p>
              <p className="text-xs text-red-500">birds lost</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-gray-500">Total Health Costs</p>
              <p className="text-2xl font-bold text-gray-700">{formatCurrency(totalCost)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No health records yet</h3>
            <p className="text-gray-400 mb-4">Start tracking vaccinations and health events</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
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
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Mortality</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Administered By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.batch_name}</TableCell>
                    <TableCell>
                      <Badge className={`${getTypeBadgeColor(record.record_type)} flex items-center gap-1 w-fit`}>
                        {getTypeIcon(record.record_type)}
                        {record.record_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{record.description}</TableCell>
                    <TableCell className="text-right">
                      {record.mortality_count > 0 ? (
                        <span className="text-red-600 font-medium">{record.mortality_count}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">{record.cost ? formatCurrency(record.cost) : '-'}</TableCell>
                    <TableCell>{record.administered_by || '-'}</TableCell>
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

