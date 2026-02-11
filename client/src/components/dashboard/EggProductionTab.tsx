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
import { Plus, Egg, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EggRecord {
  id: number;
  batch_id: number;
  batch_name: string;
  date: string;
  eggs_collected: number;
  broken_eggs: number;
  notes: string | null;
  recorded_by_name: string;
  created_at: string;
}

interface Batch {
  id: number;
  batch_name: string;
  status: string;
}

export function EggProductionTab() {
  const [records, setRecords] = useState<EggRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchId: '',
    date: new Date().toISOString().split('T')[0],
    eggsCollected: '',
    brokenEggs: '0',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [eggsRes, batchesRes] = await Promise.all([
        poultryApi.getEggs(),
        poultryApi.getBatches()
      ]);
      setRecords(eggsRes.data);
      setBatches(batchesRes.data.filter((b: Batch) => b.status === 'active'));
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load egg records');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await poultryApi.createEgg({
        batchId: parseInt(formData.batchId),
        date: formData.date,
        eggsCollected: parseInt(formData.eggsCollected),
        brokenEggs: parseInt(formData.brokenEggs) || 0,
        notes: formData.notes || undefined,
      });
      toast.success('Egg record added successfully');
      setIsDialogOpen(false);
      setFormData({
        batchId: '',
        date: new Date().toISOString().split('T')[0],
        eggsCollected: '',
        brokenEggs: '0',
        notes: '',
      });
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add record');
    } finally {
      setSubmitting(false);
    }
  }

  const totalEggs = records.reduce((sum, r) => sum + r.eggs_collected, 0);
  const totalBroken = records.reduce((sum, r) => sum + r.broken_eggs, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Egg Production</h2>
          <p className="text-gray-500">Track daily egg collection from your flocks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Record Eggs
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Egg Collection</DialogTitle>
              <DialogDescription>Enter today's egg collection details</DialogDescription>
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

              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Eggs Collected *</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="150"
                    value={formData.eggsCollected}
                    onChange={(e) => setFormData({ ...formData, eggsCollected: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Broken Eggs</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.brokenEggs}
                    onChange={(e) => setFormData({ ...formData, brokenEggs: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any observations..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitting || !formData.batchId}>
                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600">Total Collected</p>
                <p className="text-3xl font-bold text-amber-700">{totalEggs.toLocaleString()}</p>
              </div>
              <Egg className="w-10 h-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Broken Eggs</p>
                <p className="text-3xl font-bold text-gray-700">{totalBroken.toLocaleString()}</p>
              </div>
              <div className="text-red-400 text-sm">
                {totalEggs > 0 ? ((totalBroken / totalEggs) * 100).toFixed(1) : 0}% loss
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Records</p>
                <p className="text-3xl font-bold text-gray-700">{records.length}</p>
              </div>
              <div className="text-amber-500 text-sm">entries</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : records.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Egg className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No egg records yet</h3>
            <p className="text-gray-400 mb-4">Start recording your daily egg collection</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
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
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Broken</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                    <TableCell>{record.batch_name}</TableCell>
                    <TableCell className="text-right font-medium text-amber-600">{record.eggs_collected.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-red-500">{record.broken_eggs}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{record.notes || '-'}</TableCell>
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

