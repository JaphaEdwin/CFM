import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { settingsApi, mediaApi } from '@/lib/api';
import { toast } from 'sonner';
import { Save, Loader2, Globe, Phone, Mail, MapPin, DollarSign, FileText, BarChart3, MessageSquare, Star, User, ImagePlus, Camera, X } from 'lucide-react';

interface SiteSettings {
  [key: string]: string;
}

interface MediaItem {
  id: number;
  filename: string;
  url: string;
  title: string | null;
  category: string;
}

export function SiteSettingsTab() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testimonialMedia, setTestimonialMedia] = useState<MediaItem[]>([]);
  const [imagePickerOpen, setImagePickerOpen] = useState<number | null>(null);

  useEffect(() => {
    loadSettings();
    loadTestimonialMedia();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsApi.getPublic();
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load site settings');
    } finally {
      setLoading(false);
    }
  };

  const loadTestimonialMedia = async () => {
    try {
      const response = await mediaApi.getPublic({ category: 'testimonials', type: 'image' });
      setTestimonialMedia(response.data);
    } catch (error) {
      console.error('Failed to load testimonial media');
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsApi.updateMany(settings);
      toast.success('Site settings updated successfully!');
      setHasChanges(false);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Content Management</h2>
          <p className="text-gray-600">Update the content displayed on the customer landing page</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={!hasChanges || saving}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="hero" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Stats</span>
          </TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section Content</CardTitle>
              <CardDescription>
                The main banner content that visitors see first on your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title">Main Title</Label>
                <Input
                  id="hero_title"
                  value={settings.hero_title || ''}
                  onChange={(e) => handleChange('hero_title', e.target.value)}
                  placeholder="Fresh from Our Farm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Subtitle</Label>
                <Input
                  id="hero_subtitle"
                  value={settings.hero_subtitle || ''}
                  onChange={(e) => handleChange('hero_subtitle', e.target.value)}
                  placeholder="Premium Quality Poultry Products"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_description">Description</Label>
                <Textarea
                  id="hero_description"
                  value={settings.hero_description || ''}
                  onChange={(e) => handleChange('hero_description', e.target.value)}
                  placeholder="Country Farm Matugga is your trusted source..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Info */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update your farm's contact details shown on the website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone_number"
                    value={settings.phone_number || ''}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="+256 700 123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    WhatsApp Number
                  </Label>
                  <Input
                    id="whatsapp_number"
                    value={settings.whatsapp_number || ''}
                    onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                    placeholder="+256 700 123456"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="info@countryfarmmatugga.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Farm Address
                </Label>
                <Textarea
                  id="address"
                  value={settings.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Matugga, Wakiso District, Uganda"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products */}
        <TabsContent value="products" className="space-y-4">
          {/* Product Count Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Products Displayed on Homepage</CardTitle>
              <CardDescription>
                Configure the products shown to visitors. Upload product images in the Media tab under the "Products" category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Number of Products to Display</Label>
                <Select
                  value={settings.product_count || '3'}
                  onValueChange={(val) => handleChange('product_count', val)}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <SelectItem key={n} value={String(n)}>{n} Product{n > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: parseInt(settings.product_count || '3') }, (_, i) => i + 1).map(num => {
              // Backwards-compatible key mapping for old settings
              const nameKey = `product_${num}_name`;
              const descKey = `product_${num}_description`;
              const priceKey = `product_${num}_price`;
              const featuresKey = `product_${num}_features`;
              const defaultNames: Record<number, string> = { 1: 'Fresh Eggs', 2: 'Live Birds', 3: 'Organic Manure' };
              const defaultDescPlaceholders: Record<number, string> = {
                1: 'Farm fresh eggs collected daily...',
                2: 'Healthy, well-fed chickens ready for your table...',
                3: 'Natural fertilizer perfect for your garden...',
              };

              return (
                <Card key={num}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Product {num}: {settings[nameKey] || defaultNames[num] || `Product ${num}`}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Upload image in Media → Products category (image #{num} will be used)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product Name</Label>
                      <Input
                        value={settings[nameKey] || ''}
                        onChange={(e) => handleChange(nameKey, e.target.value)}
                        placeholder={defaultNames[num] || `Product ${num} name`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Price Display</Label>
                      <Input
                        value={settings[priceKey] || ''}
                        onChange={(e) => handleChange(priceKey, e.target.value)}
                        placeholder="e.g. From UGX 15,000/tray"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={settings[descKey] || ''}
                        onChange={(e) => handleChange(descKey, e.target.value)}
                        placeholder={defaultDescPlaceholders[num] || 'Describe this product...'}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Features (comma-separated)</Label>
                      <Input
                        value={settings[featuresKey] || ''}
                        onChange={(e) => handleChange(featuresKey, e.target.value)}
                        placeholder="e.g. Free-range, No hormones, Daily collection"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Prices */}
          <Card className="md:col-span-3 mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Order Prices (used in customer order form)</CardTitle>
              <CardDescription>Set the exact numeric prices customers will see when placing orders. Enter amounts in UGX without commas.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'order_price_eggs_tray', label: 'Eggs (Tray of 30)' },
                  { key: 'order_price_eggs_crate', label: 'Eggs (Crate - 12 trays)' },
                  { key: 'order_price_broiler_chicken', label: 'Broiler Chicken' },
                  { key: 'order_price_layer_chicken', label: 'Layer Chicken' },
                  { key: 'order_price_kienyeji_chicken', label: 'Kienyeji Chicken' },
                  { key: 'order_price_day_old_chicks', label: 'Day-Old Chicks' },
                  { key: 'order_price_manure_bag', label: 'Manure (50kg bag)' },
                  { key: 'order_price_manure_truck', label: 'Manure (Truck load)' },
                ].map(item => (
                  <div key={item.key} className="space-y-1">
                    <Label htmlFor={item.key} className="text-xs">{item.label}</Label>
                    <Input
                      id={item.key}
                      type="number"
                      min={0}
                      value={settings[item.key] || ''}
                      onChange={(e) => handleChange(item.key, e.target.value)}
                      placeholder="e.g. 15000"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials */}
        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                Customer Testimonials
              </CardTitle>
              <CardDescription>
                Manage the customer reviews displayed on the landing page. These help build trust with new visitors.
                <span className="block mt-1 text-amber-600">
                  💡 Tip: Upload customer photos in Media Management → Testimonials category first.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((num) => (
                  <Card key={num} className="border-2 border-dashed border-amber-200 hover:border-amber-400 transition-colors overflow-hidden">
                    {/* Testimonial Number Badge */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 text-center">
                      TESTIMONIAL #{num}
                    </div>
                    
                    {/* Image Selection Section */}
                    <div className="p-4 bg-amber-50/50 border-b border-amber-100">
                      <Label className="text-xs text-gray-500 mb-2 block">Customer Photo</Label>
                      <div className="flex items-center gap-3">
                        {/* Current Image Preview */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-200 flex-shrink-0">
                          {settings[`testimonial_${num}_image`] ? (
                            <img 
                              src={settings[`testimonial_${num}_image`]} 
                              alt={`Customer ${num}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-amber-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-amber-600" />
                            </div>
                          )}
                        </div>
                        
                        {/* Change Image Button */}
                        <Dialog open={imagePickerOpen === num} onOpenChange={(open) => setImagePickerOpen(open ? num : null)}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                              <Camera className="h-4 w-4 mr-2" />
                              {settings[`testimonial_${num}_image`] ? 'Change Photo' : 'Add Photo'}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                  <span className="text-amber-600 font-bold">{num}</span>
                                </div>
                                Select Photo for Testimonial #{num}
                              </DialogTitle>
                              <DialogDescription>
                                Choose a photo for {settings[`testimonial_${num}_name`] || `Customer ${num}`}'s testimonial.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              {testimonialMedia.length > 0 ? (
                                <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1">
                                  {/* Option to clear/use default */}
                                  <button
                                    onClick={() => {
                                      handleChange(`testimonial_${num}_image`, '');
                                      setImagePickerOpen(null);
                                    }}
                                    className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-amber-400 hover:bg-amber-50 transition-colors ${
                                      !settings[`testimonial_${num}_image`] ? 'border-amber-500 bg-amber-50' : 'border-gray-300'
                                    }`}
                                  >
                                    <User className="h-6 w-6 text-gray-400" />
                                    <span className="text-xs text-gray-500">Default</span>
                                  </button>
                                  {testimonialMedia.map((media) => (
                                    <button
                                      key={media.id}
                                      onClick={() => {
                                        handleChange(`testimonial_${num}_image`, media.url);
                                        setImagePickerOpen(null);
                                      }}
                                      className={`aspect-square rounded-lg overflow-hidden border-2 hover:border-amber-400 transition-colors ${
                                        settings[`testimonial_${num}_image`] === media.url ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200'
                                      }`}
                                    >
                                      <img 
                                        src={media.url} 
                                        alt={media.title || 'Customer'}
                                        className="w-full h-full object-cover"
                                      />
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 bg-gray-50 rounded-lg">
                                  <ImagePlus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                  <p className="text-gray-500 mb-2">No testimonial images uploaded yet</p>
                                  <p className="text-sm text-gray-400">
                                    Go to Media Management and upload images with category "Testimonials"
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {/* Clear Image Button */}
                        {settings[`testimonial_${num}_image`] && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleChange(`testimonial_${num}_image`, '')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3 pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-gray-500">Star Rating</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 cursor-pointer transition-colors ${
                                star <= parseInt(settings[`testimonial_${num}_rating`] || '5')
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-300 hover:text-amber-300'
                              }`}
                              onClick={() => handleChange(`testimonial_${num}_rating`, star.toString())}
                            />
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor={`testimonial_${num}_name`} className="text-xs text-gray-500">Customer Name</Label>
                          <Input
                            id={`testimonial_${num}_name`}
                            value={settings[`testimonial_${num}_name`] || ''}
                            onChange={(e) => handleChange(`testimonial_${num}_name`, e.target.value)}
                            placeholder="John Doe"
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`testimonial_${num}_role`} className="text-xs text-gray-500">Role/Title</Label>
                          <Input
                            id={`testimonial_${num}_role`}
                            value={settings[`testimonial_${num}_role`] || ''}
                            onChange={(e) => handleChange(`testimonial_${num}_role`, e.target.value)}
                            placeholder="Restaurant Owner"
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`testimonial_${num}_content`} className="text-xs text-gray-500">Their Review</Label>
                        <Textarea
                          id={`testimonial_${num}_content`}
                          value={settings[`testimonial_${num}_content`] || ''}
                          onChange={(e) => handleChange(`testimonial_${num}_content`, e.target.value)}
                          placeholder="What did this customer say about your products?"
                          rows={3}
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-medium text-amber-900">Tips for Great Testimonials</h4>
                    <ul className="text-sm text-amber-700 mt-1 space-y-1">
                      <li>• Use real customer names and their business/role</li>
                      <li>• Keep reviews specific - mention products or service quality</li>
                      <li>• Shorter reviews (2-3 sentences) work best</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Farm Statistics</CardTitle>
              <CardDescription>
                These numbers are displayed on the landing page to show your farm's achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_birds">Total Birds</Label>
                  <Input
                    id="stat_birds"
                    value={settings.stat_birds || ''}
                    onChange={(e) => handleChange('stat_birds', e.target.value)}
                    placeholder="5000+"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_eggs">Daily Eggs</Label>
                  <Input
                    id="stat_eggs"
                    value={settings.stat_eggs || ''}
                    onChange={(e) => handleChange('stat_eggs', e.target.value)}
                    placeholder="2000+"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_customers">Happy Customers</Label>
                  <Input
                    id="stat_customers"
                    value={settings.stat_customers || ''}
                    onChange={(e) => handleChange('stat_customers', e.target.value)}
                    placeholder="500+"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat_years">Years Experience</Label>
                  <Input
                    id="stat_years"
                    value={settings.stat_years || ''}
                    onChange={(e) => handleChange('stat_years', e.target.value)}
                    placeholder="10+"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-100 border border-amber-300 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <FileText className="h-5 w-5 text-amber-600" />
          <span className="text-amber-800 font-medium">You have unsaved changes</span>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={saving}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {saving ? 'Saving...' : 'Save Now'}
          </Button>
        </div>
      )}
    </div>
  );
}
