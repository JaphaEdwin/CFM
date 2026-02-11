import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ordersApi } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Loader2, Plus, Trash2, ShoppingCart, CheckCircle2, Egg, Bird, Leaf, Package
} from 'lucide-react';

interface OrderItem {
  product: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

const PRODUCTS = [
  { value: 'eggs_tray', label: 'Fresh Eggs (Tray of 30)', unit: 'trays', settingsKey: 'order_price_eggs_tray', fallbackPrice: 15000 },
  { value: 'eggs_crate', label: 'Fresh Eggs (Crate - 12 trays)', unit: 'crates', settingsKey: 'order_price_eggs_crate', fallbackPrice: 170000 },
  { value: 'broiler_chicken', label: 'Broiler Chicken (Live)', unit: 'birds', settingsKey: 'order_price_broiler_chicken', fallbackPrice: 25000 },
  { value: 'layer_chicken', label: 'Layer Chicken (Live)', unit: 'birds', settingsKey: 'order_price_layer_chicken', fallbackPrice: 20000 },
  { value: 'kienyeji_chicken', label: 'Kienyeji/Local Chicken', unit: 'birds', settingsKey: 'order_price_kienyeji_chicken', fallbackPrice: 35000 },
  { value: 'day_old_chicks', label: 'Day-Old Chicks', unit: 'chicks', settingsKey: 'order_price_day_old_chicks', fallbackPrice: 3500 },
  { value: 'manure_bag', label: 'Chicken Manure (50kg bag)', unit: 'bags', settingsKey: 'order_price_manure_bag', fallbackPrice: 5000 },
  { value: 'manure_truck', label: 'Chicken Manure (Truck load)', unit: 'loads', settingsKey: 'order_price_manure_truck', fallbackPrice: 200000 },
];

interface OrderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: Record<string, string>;
}

export function OrderFormDialog({ open, onOpenChange, settings }: OrderFormDialogProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([
    { product: '', quantity: 1, unit: '', unitPrice: 0 }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the admin-set price for a product
  const getProductPrice = (productValue: string): number => {
    const product = PRODUCTS.find(p => p.value === productValue);
    if (!product) return 0;
    const settingsPrice = parseInt(settings[product.settingsKey] || '');
    return isNaN(settingsPrice) ? product.fallbackPrice : settingsPrice;
  };

  const addItem = () => {
    setItems([...items, { product: '', quantity: 1, unit: '', unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-fill unit and price from admin settings when product is selected
    if (field === 'product') {
      const product = PRODUCTS.find(p => p.value === value);
      if (product) {
        updated[index].unit = product.unit;
        updated[index].unitPrice = getProductPrice(value);
      }
    }
    
    setItems(updated);
    // Clear item error when changed
    if (errors[`item_${index}`]) {
      setErrors(prev => { const n = { ...prev }; delete n[`item_${index}`]; return n; });
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', { 
      style: 'currency', 
      currency: 'UGX',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  const handleSubmit = async () => {
    // Validation
    const newErrors: Record<string, string> = {};
    
    if (!customerName.trim()) {
      newErrors.customerName = 'Full name is required';
    }
    if (!customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^[\d+\s()-]{7,20}$/.test(customerPhone.trim())) {
      newErrors.customerPhone = 'Please enter a valid phone number';
    }
    if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }
    
    const validItems = items.filter(i => i.product && i.quantity > 0);
    if (validItems.length === 0) {
      newErrors.items = 'Please add at least one product to your order';
    }
    
    // Check each item has a product selected
    items.forEach((item, index) => {
      if (!item.product) {
        newErrors[`item_${index}`] = 'Please select a product';
      } else if (item.quantity < 1) {
        newErrors[`item_${index}`] = 'Quantity must be at least 1';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }
    
    setErrors({});

    // Map product values to readable labels
    const formattedItems = validItems.map(item => {
      const productInfo = PRODUCTS.find(p => p.value === item.product);
      return {
        product: productInfo?.label || item.product,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
      };
    });

    try {
      setSubmitting(true);
      const response = await ordersApi.place({
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim() || undefined,
        items: formattedItems,
        notes: notes.trim() || undefined,
      });
      
      setOrderSuccess(response.data.orderNumber);
      toast.success('Order placed successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after a brief delay to avoid visual glitch
    setTimeout(() => {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setNotes('');
      setItems([{ product: '', quantity: 1, unit: '', unitPrice: 0 }]);
      setOrderSuccess(null);
      setErrors({});
    }, 300);
  };

  // Success state
  if (orderSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
            <p className="text-gray-600 mb-4">
              Your order has been received successfully. We'll contact you shortly to confirm.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-700">Your Order Number</p>
              <p className="text-xl font-bold text-amber-800">{orderSuccess}</p>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              You can reach us at <span className="font-semibold">{settings.phone_number || '+256 763 564 896'}</span> for any questions.
            </p>
            <Button onClick={handleClose} className="bg-amber-600 hover:bg-amber-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShoppingCart className="w-6 h-6 text-amber-600" />
            Place Your Order
          </DialogTitle>
          <DialogDescription>
            Fill in your details and select the products you'd like to order. We'll contact you to confirm delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 border-b pb-2">Your Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name <span className="text-red-500">*</span></Label>
                <Input
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); if (errors.customerName) setErrors(prev => { const n = { ...prev }; delete n.customerName; return n; }); }}
                  placeholder="e.g. John Mukasa"
                  className={errors.customerName ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  required
                />
                {errors.customerName && <p className="text-xs text-red-500">{errors.customerName}</p>}
              </div>
              <div className="space-y-2">
                <Label>Phone Number <span className="text-red-500">*</span></Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => { setCustomerPhone(e.target.value); if (errors.customerPhone) setErrors(prev => { const n = { ...prev }; delete n.customerPhone; return n; }); }}
                  placeholder="e.g. +256 7XX XXX XXX"
                  className={errors.customerPhone ? 'border-red-500 focus-visible:ring-red-500' : ''}
                  required
                />
                {errors.customerPhone && <p className="text-xs text-red-500">{errors.customerPhone}</p>}
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => { setCustomerEmail(e.target.value); if (errors.customerEmail) setErrors(prev => { const n = { ...prev }; delete n.customerEmail; return n; }); }}
                  placeholder="e.g. john@example.com"
                  className={errors.customerEmail ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.customerEmail && <p className="text-xs text-red-500">{errors.customerEmail}</p>}
              </div>
              <div className="space-y-2">
                <Label>Delivery Address (optional)</Label>
                <Input
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Kampala, Wandegeya"
                />
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-gray-800">Order Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="text-amber-600 border-amber-300 hover:bg-amber-50">
                <Plus className="w-4 h-4 mr-1" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Item {index + 1}</span>
                  {items.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">Product <span className="text-red-500">*</span></Label>
                    <Select value={item.product} onValueChange={(val) => updateItem(index, 'product', val)}>
                      <SelectTrigger className={errors[`item_${index}`] ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRODUCTS.map(p => (
                          <SelectItem key={p.value} value={p.value}>
                            <span className="flex items-center justify-between gap-2 w-full">
                              {p.label}
                              <span className="text-xs text-gray-500 ml-2">{formatCurrency(getProductPrice(p.value))}/{p.unit}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`item_${index}`] && <p className="text-xs text-red-500">{errors[`item_${index}`]}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price (UGX)</Label>
                    <div className="h-9 flex items-center px-3 bg-gray-100 border border-gray-200 rounded-md text-gray-700 font-medium text-sm">
                      {item.product ? formatCurrency(item.unitPrice) : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Subtotal</Label>
                    <div className="h-9 flex items-center px-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 font-semibold text-sm">
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="font-semibold text-amber-800">Total Amount:</span>
              <span className="text-2xl font-bold text-amber-800">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Additional Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions, preferred delivery time, etc."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Place Order ({formatCurrency(totalAmount)})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
