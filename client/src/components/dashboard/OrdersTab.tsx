import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ordersApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Loader2, ShoppingCart, Phone, Mail, MapPin, Clock, 
  Trash2, Eye, Package, CheckCircle2, XCircle, Truck, RefreshCw
} from 'lucide-react';

interface OrderItem {
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface Order {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string | null;
  order_items: OrderItem[];
  total_amount: number;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: ShoppingCart },
  confirmed: { label: 'Confirmed', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: CheckCircle2 },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Package },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200', icon: Truck },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export function OrdersTab({ onNewOrderCountChange }: { onNewOrderCountChange?: (count: number) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getAll();
      setOrders(response.data);
      
      // Count new orders and notify parent
      const newCount = response.data.filter((o: Order) => o.status === 'new').length;
      onNewOrderCountChange?.(newCount);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) return;
    
    try {
      await ordersApi.delete(orderId);
      toast.success('Order deleted');
      loadOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
    } catch (error) {
      toast.error('Failed to delete order');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', { 
      style: 'currency', 
      currency: 'UGX',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  const newOrdersCount = orders.filter(o => o.status === 'new').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            Orders
            {newOrdersCount > 0 && (
              <span className="inline-flex items-center justify-center w-7 h-7 text-sm font-bold text-white bg-red-500 rounded-full animate-pulse">
                {newOrdersCount}
              </span>
            )}
          </h2>
          <p className="text-gray-600">Manage customer orders from the website</p>
        </div>
        <Button variant="outline" onClick={loadOrders} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
          const count = orders.filter(o => o.status === key).length;
          const StatusIcon = config.icon;
          return (
            <Card 
              key={key} 
              className={`cursor-pointer transition-all ${filterStatus === key ? 'ring-2 ring-amber-400' : 'hover:shadow-md'}`}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <StatusIcon className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders ({orders.length})</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label} ({orders.filter(o => o.status === key).length})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500 ml-auto">
          Showing {filteredOrders.length} of {orders.length} orders
        </span>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No orders found</h3>
            <p className="text-gray-400">
              {filterStatus !== 'all' ? 'Try changing the filter' : 'Orders from customers will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.new;
            const StatusIcon = statusConfig.icon;
            return (
              <Card 
                key={order.id} 
                className={`transition-all hover:shadow-md ${order.status === 'new' ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-800">{order.order_number}</span>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <span className="font-medium">{order.customer_name}</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {order.customer_phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatDate(order.created_at)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}: {' '}
                        {order.order_items.map(i => `${i.quantity} ${i.unit} ${i.product}`).join(', ')}
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-amber-700 whitespace-nowrap">
                        {formatCurrency(order.total_amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Select value={order.status} onValueChange={(val) => handleStatusChange(order.id, val)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                              <SelectItem key={key} value={key}>{config.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(order.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-600" />
              Order {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Placed on {selectedOrder && formatDate(selectedOrder.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge variant="outline" className={STATUS_CONFIG[selectedOrder.status]?.color || ''}>
                  {STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-1">Customer Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-24">Name:</span>
                    <span className="font-medium">{selectedOrder.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedOrder.customer_phone}`} className="text-amber-600 hover:underline">
                      {selectedOrder.customer_phone}
                    </a>
                  </div>
                  {selectedOrder.customer_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${selectedOrder.customer_email}`} className="text-amber-600 hover:underline">
                        {selectedOrder.customer_email}
                      </a>
                    </div>
                  )}
                  {selectedOrder.delivery_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800 border-b pb-1">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{item.product}</p>
                        <p className="text-sm text-gray-500">{item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <span className="font-semibold text-gray-800">{formatCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-amber-200">
                  <span className="font-bold text-amber-800">Total</span>
                  <span className="text-xl font-bold text-amber-800">{formatCurrency(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-800 border-b pb-1">Notes</h3>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Select value={selectedOrder.status} onValueChange={(val) => handleStatusChange(selectedOrder.id, val)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`tel:${selectedOrder.customer_phone}`)}
                  className="text-amber-600 border-amber-300"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`https://wa.me/${selectedOrder.customer_phone.replace(/\D/g, '')}`)}
                  className="text-green-600 border-green-300"
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
