import { useState, useEffect } from 'react';
import { poultryApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Bird, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Batch {
  id: number;
  batch_name: string;
  bird_type: string;
  initial_count: number;
  current_count: number;
  date_acquired: string;
  source: string | null;
  cost_per_bird: number | null;
  notes: string | null;
  status: 'active' | 'sold' | 'archived';
  created_at: string;
}

export function PoultryTab() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    batchName: '',
    birdType: 'layers',
    initialCount: '',
    dateAcquired: new Date().toISOString().split('T')[0],
    source: '',
    costPerBird: '',
    notes: '',
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      const response = await poultryApi.getBatches();
      setBatches(response.data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      await poultryApi.createBatch({
        batchName: formData.batchName,
        birdType: formData.birdType,
        initialCount: parseInt(formData.initialCount),
        dateAcquired: formData.dateAcquired,
        source: formData.source || undefined,
        costPerBird: formData.costPerBird ? parseFloat(formData.costPerBird) : undefined,
        notes: formData.notes || undefined,
      });
      toast.success('Batch created successfully');
      setIsDialogOpen(false);
      setFormData({
        batchName: '',
        birdType: 'layers',
        initialCount: '',
        dateAcquired: new Date().toISOString().split('T')[0],
        source: '',
        costPerBird: '',
        notes: '',
      });
      fetchBatches();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create batch');
    } finally {
      setSubmitting(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-amber-100 text-green-800';
      case 'sold': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Poultry Batches</h2>
          <p className="text-gray-500">Manage your chicken batches and flocks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Batch</DialogTitle>
              <DialogDescription>Enter the details of your new poultry batch</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batchName">Batch Name *</Label>
                <Input
                  id="batchName"
                  placeholder="e.g., Batch A - January 2024"
                  value={formData.batchName}
                  onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="birdType">Bird Type *</Label>
                  <Select value={formData.birdType} onValueChange={(value) => setFormData({ ...formData, birdType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="layers">Layers</SelectItem>
                      <SelectItem value="broilers">Broilers</SelectItem>
                      <SelectItem value="indigenous">Indigenous</SelectItem>
                      <SelectItem value="ducks">Ducks</SelectItem>
                      <SelectItem value="turkeys">Turkeys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialCount">Initial Count *</Label>
                  <Input
                    id="initialCount"
                    type="number"
                    min="1"
                    placeholder="500"
                    value={formData.initialCount}
                    onChange={(e) => setFormData({ ...formData, initialCount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateAcquired">Date Acquired *</Label>
                  <Input
                    id="dateAcquired"
                    type="date"
                    value={formData.dateAcquired}
                    onChange={(e) => setFormData({ ...formData, dateAcquired: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPerBird">Cost per Bird (UGX)</Label>
                  <Input
                    id="costPerBird"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="5000"
                    value={formData.costPerBird}
                    onChange={(e) => setFormData({ ...formData, costPerBird: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="source">Source/Supplier</Label>
                <Input
                  id="source"
                  placeholder="e.g., Kuku Farms Ltd"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Batch'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : batches.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bird className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No batches yet</h3>
            <p className="text-gray-400 mb-4">Add your first poultry batch to get started</p>
            <Button onClick={() => setIsDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
              <Plus className="w-4 h-4 mr-2" />
              Add First Batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Initial</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead>Date Acquired</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_name}</TableCell>
                    <TableCell className="capitalize">{batch.bird_type}</TableCell>
                    <TableCell className="text-right">{batch.initial_count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{batch.current_count.toLocaleString()}</TableCell>
                    <TableCell>{new Date(batch.date_acquired).toLocaleDateString()}</TableCell>
                    <TableCell>{batch.source || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(batch.status)}>{batch.status}</Badge>
                    </TableCell>
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

