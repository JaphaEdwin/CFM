import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { settingsApi, mediaApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderFormDialog } from '@/components/OrderFormDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { 
  Egg, 
  Bird, 
  ShoppingBag, 
  Truck, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  ChevronRight,
  ChevronUp,
  Leaf,
  Award,
  Users,
  LogIn,
  UserPlus,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  X
} from 'lucide-react';

// Animated counter hook
function useCountUp(end: number, duration: number = 2000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) {
      animateCount();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true);
          animateCount();
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, hasStarted]);

  const animateCount = () => {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  return { count, ref };
}

// Parse stat value to get numeric part
function parseStatValue(value: string): { num: number; suffix: string } {
  const match = value.match(/^([\d,]+)(\+|K\+|%)?$/);
  if (match) {
    const num = parseInt(match[1].replace(/,/g, ''), 10);
    const suffix = match[2] || '';
    return { num, suffix };
  }
  return { num: 0, suffix: value };
}

// Animated stat component
function AnimatedStat({ stat, num, suffix }: { stat: { value: string; label: string; icon: any }; num: number; suffix: string }) {
  const { count, ref } = useCountUp(num, 2000);
  return (
    <div ref={ref} className="text-center group">
      <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/40 rounded-full mb-3 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50 group-hover:scale-110 transition-all duration-300">
        <stat.icon className="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
        {num > 0 ? `${count.toLocaleString()}${suffix}` : stat.value}
      </div>
      <div className="text-gray-500 dark:text-gray-400">{stat.label}</div>
    </div>
  );
}

interface SiteSettings {
  [key: string]: string;
}

interface MediaItem {
  id: number;
  filename: string;
  file_type: 'image' | 'video';
  category: string;
  title: string | null;
  description: string | null;
  url: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout, isEmployee } = useAuth();
  const [settings, setSettings] = useState<SiteSettings>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [galleryImages, setGalleryImages] = useState<MediaItem[]>([]);
  const [videos, setVideos] = useState<MediaItem[]>([]);
  const [heroImage, setHeroImage] = useState<MediaItem | null>(null);
  const [productImages, setProductImages] = useState<MediaItem[]>([]);
  const [aboutImage, setAboutImage] = useState<MediaItem | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  // Handle scroll for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    loadSettings();
    loadMedia();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsApi.getPublic();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setSettingsLoaded(true);
    }
  };

  const loadMedia = async () => {
    try {
      const response = await mediaApi.getPublic();
      const allMedia = response.data as MediaItem[];
      
      // Get hero image
      const heroImages = allMedia.filter(m => m.category === 'hero' && m.file_type === 'image');
      if (heroImages.length > 0) setHeroImage(heroImages[0]);
      
      // Get product images
      const prodImages = allMedia.filter(m => m.category === 'products' && m.file_type === 'image');
      setProductImages(prodImages);
      
      // Get about/farm worker image
      const aboutImages = allMedia.filter(m => m.category === 'about' && m.file_type === 'image');
      if (aboutImages.length > 0) setAboutImage(aboutImages[0]);
      
      // Get gallery images
      const gallery = allMedia.filter(m => m.category === 'gallery' && m.file_type === 'image');
      setGalleryImages(gallery);
      
      // Get videos
      const videoItems = allMedia.filter(m => m.file_type === 'video');
      setVideos(videoItems);
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  };

  const defaultProductImages = [
    "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop",
  ];

  // Build products from admin settings - support up to 6 products
  const productCount = parseInt(settings.product_count || '3');
  const products = Array.from({ length: Math.min(productCount, 6) }, (_, i) => {
    const idx = i + 1;
    const defaultNames = ['Fresh Eggs', 'Live Poultry', 'Organic Manure'];
    const defaultDescs = [
      'Farm-fresh eggs collected daily from our healthy, free-range chickens.',
      'Healthy chickens raised with natural feed and proper care.',
      'High-quality chicken manure for your garden and farm.',
    ];
    const defaultPrices = ['From UGX 15,000/tray', 'From UGX 25,000/bird', 'From UGX 5,000/bag'];
    const defaultFeatures = [
      ['Free-range', 'No hormones', 'Daily collection'],
      ['Well-fed', 'Vaccinated', 'Healthy breeds'],
      ['Nutrient-rich', 'Organic', 'Garden-ready'],
    ];
    const defaultIcons = [Egg, Bird, Leaf];

    // For backwards compatibility, map old settings keys for the first 3 products
    let title: string, description: string, price: string, features: string[], iconComp: any;
    if (idx === 1) {
      title = settings.product_1_name || settings.eggs_title || defaultNames[0];
      description = settings.product_1_description || settings.eggs_description || defaultDescs[0];
      price = settings.product_1_price || settings.eggs_price || defaultPrices[0];
      features = (settings.product_1_features || '').split(',').filter(Boolean).length > 0
        ? settings.product_1_features.split(',').map((f: string) => f.trim())
        : defaultFeatures[0];
      iconComp = Egg;
    } else if (idx === 2) {
      title = settings.product_2_name || settings.birds_title || defaultNames[1];
      description = settings.product_2_description || settings.birds_description || defaultDescs[1];
      price = settings.product_2_price || settings.birds_price || defaultPrices[1];
      features = (settings.product_2_features || '').split(',').filter(Boolean).length > 0
        ? settings.product_2_features.split(',').map((f: string) => f.trim())
        : defaultFeatures[1];
      iconComp = Bird;
    } else if (idx === 3) {
      title = settings.product_3_name || settings.manure_title || defaultNames[2];
      description = settings.product_3_description || settings.manure_description || defaultDescs[2];
      price = settings.product_3_price || settings.manure_price || defaultPrices[2];
      features = (settings.product_3_features || '').split(',').filter(Boolean).length > 0
        ? settings.product_3_features.split(',').map((f: string) => f.trim())
        : defaultFeatures[2];
      iconComp = Leaf;
    } else {
      title = settings[`product_${idx}_name`] || `Product ${idx}`;
      description = settings[`product_${idx}_description`] || '';
      price = settings[`product_${idx}_price`] || '';
      features = (settings[`product_${idx}_features`] || '').split(',').filter(Boolean).map((f: string) => f.trim());
      iconComp = defaultIcons[(idx - 1) % 3];
    }

    // Use uploaded product image, or fallback
    const imgUrl = productImages[i]?.url || defaultProductImages[i] || defaultProductImages[0];

    return { icon: iconComp, title, description, price, features, image: imgUrl };
  });

  const stats = [
    { value: settings.stat_birds || '5000+', label: 'Birds Raised', icon: Bird },
    { value: settings.stat_eggs || '10K+', label: 'Eggs Monthly', icon: Egg },
    { value: settings.stat_customers || '500+', label: 'Happy Customers', icon: Users },
    { value: settings.stat_years || '5+', label: 'Years Experience', icon: Award },
  ];

  // Testimonials from settings (editable by employees)
  const testimonials = [
    {
      name: settings.testimonial_1_name || 'Sarah Nakato',
      role: settings.testimonial_1_role || 'Restaurant Owner',
      content: settings.testimonial_1_content || 'The quality of eggs from Country Farm is exceptional. My customers love the rich taste!',
      rating: parseInt(settings.testimonial_1_rating || '5'),
      image: settings.testimonial_1_image || '',
    },
    {
      name: settings.testimonial_2_name || 'John Mukasa',
      role: settings.testimonial_2_role || 'Grocery Store Owner',
      content: settings.testimonial_2_content || 'Reliable delivery and consistent quality. They are my go-to supplier for fresh eggs.',
      rating: parseInt(settings.testimonial_2_rating || '5'),
      image: settings.testimonial_2_image || '',
    },
    {
      name: settings.testimonial_3_name || 'Grace Achieng',
      role: settings.testimonial_3_role || 'Home Customer',
      content: settings.testimonial_3_content || 'Fresh, affordable, and the team is always friendly. Highly recommend!',
      rating: parseInt(settings.testimonial_3_rating || '5'),
      image: settings.testimonial_3_image || '',
    },
  ];

  // Loading skeleton
  if (!settingsLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-amber-50 dark:from-gray-900 dark:to-gray-950">
        {/* Nav skeleton */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-amber-100 h-16 flex items-center px-6">
          <Skeleton className="w-16 h-16 rounded-full" />
          <Skeleton className="w-32 h-6 ml-3" />
        </div>
        {/* Hero skeleton */}
        <div className="bg-amber-800/20 h-[500px] flex items-center justify-center">
          <div className="text-center space-y-4">
            <Skeleton className="w-32 h-32 rounded-full mx-auto" />
            <Skeleton className="w-64 h-10 mx-auto" />
            <Skeleton className="w-48 h-6 mx-auto" />
            <div className="flex gap-4 justify-center mt-6">
              <Skeleton className="w-32 h-12 rounded-lg" />
              <Skeleton className="w-32 h-12 rounded-lg" />
            </div>
          </div>
        </div>
        {/* Stats skeleton */}
        <div className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="w-14 h-14 rounded-full mx-auto mb-3" />
                <Skeleton className="w-20 h-8 mx-auto mb-2" />
                <Skeleton className="w-24 h-4 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-amber-50 dark:from-gray-900 dark:to-gray-950 scroll-smooth">
      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${(settings.whatsapp_number || settings.phone_number || '+256700000000').replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 hover:scale-110 animate-bounce"
        style={{ animationDuration: '2s' }}
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* Back to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 bg-amber-600 hover:bg-amber-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        title="Back to top"
      >
        <ChevronUp className="w-6 h-6" />
      </button>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-amber-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Country Farm Matugga" className="w-16 h-16 object-contain" />
              <span className="font-bold text-xl text-gray-800 dark:text-white">Country Farm</span>
            </div>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="#products" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Products</a>
              <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">About</a>
              <a href="#testimonials" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Reviews</a>
              <a href="#contact" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden relative group">
                    <div className="flex flex-col gap-1.5 w-6 transition-all duration-300">
                      <span className={`block h-0.5 bg-amber-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                      <span className={`block h-0.5 bg-amber-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : ''}`}></span>
                      <span className={`block h-0.5 bg-amber-600 rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                    </div>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-gradient-to-b from-amber-50 to-white dark:from-gray-900 dark:to-gray-950 border-l-2 border-amber-200 dark:border-gray-700 p-0">
                  {/* Header with Logo */}
                  <div className="bg-gradient-to-r from-amber-600 to-orange-500 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <img src="/logo.png" alt="Logo" className="w-12 h-12 rounded-full bg-white/20 p-1" />
                      <div>
                        <h3 className="font-bold text-lg">Country Farm</h3>
                        <p className="text-amber-100 text-sm">Matugga</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation Links */}
                  <div className="p-6">
                    <nav className="space-y-2">
                      {[
                        { href: '#products', icon: ShoppingBag, label: 'Products' },
                        { href: '#about', icon: Award, label: 'About Us' },
                        { href: '#testimonials', icon: Star, label: 'Reviews' },
                        { href: '#contact', icon: Phone, label: 'Contact' },
                      ].map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-4 px-4 py-3 rounded-xl text-gray-700 hover:bg-amber-100 hover:text-amber-700 transition-all duration-300 group"
                        >
                          <div className="w-10 h-10 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                            <item.icon className="w-5 h-5 text-amber-600" />
                          </div>
                          <span className="font-medium text-lg">{item.label}</span>
                          <ChevronRight className="w-5 h-5 ml-auto text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                        </a>
                      ))}
                    </nav>
                    
                    {/* Divider */}
                    <div className="my-6 border-t border-amber-200" />
                    
                    {/* Auth Section */}
                    <div className="space-y-3">
                      {user ? (
                        <>
                          <div className="bg-amber-50 rounded-xl p-4 mb-4">
                            <p className="text-sm text-gray-500">Signed in as</p>
                            <p className="font-semibold text-gray-800">{user.full_name}</p>
                            <p className="text-xs text-amber-600">{user.email}</p>
                          </div>
                          {isEmployee && (
                            <Button 
                              onClick={() => { setMobileMenuOpen(false); setLocation('/dashboard'); }} 
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-12 rounded-xl"
                            >
                              <LayoutDashboard className="w-5 h-5 mr-2" />
                              Go to Dashboard
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            onClick={() => { setMobileMenuOpen(false); logout(); }} 
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 h-12 rounded-xl"
                          >
                            <LogOut className="w-5 h-5 mr-2" />
                            Sign Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => { setMobileMenuOpen(false); setLocation('/login'); }} 
                            className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 h-12 rounded-xl"
                          >
                            <LogIn className="w-5 h-5 mr-2" />
                            Sign In
                          </Button>
                          <Button 
                            onClick={() => { setMobileMenuOpen(false); setLocation('/register'); }} 
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 h-12 rounded-xl"
                          >
                            <UserPlus className="w-5 h-5 mr-2" />
                            Create Account
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-100">
                    <p className="text-center text-sm text-gray-400">
                      © 2026 Country Farm Matugga
                    </p>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <span className="hidden sm:inline text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{user.full_name}</span>
                  </span>
                  {isEmployee && (
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation('/dashboard')}
                      className="border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    onClick={() => logout()}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    onClick={() => setLocation('/login')}
                    className="text-gray-600 hover:text-amber-600"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                  <Button 
                    onClick={() => setLocation('/register')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </>
              )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image - Dynamic or Default */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: heroImage 
              ? `url('${heroImage.url}')` 
              : "url('https://images.unsplash.com/photo-1569428034239-f9565e32e224?w=1920&h=1080&fit=crop')" 
          }}
        />
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/60 via-orange-800/50 to-amber-900/60" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto">
            <div className="text-center">
              <img src="/logo.png" alt="Country Farm Matugga Logo" className="w-44 h-44 mx-auto mb-6 drop-shadow-2xl" />
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {settings.hero_title || 'Fresh From Our Farm'}<br />
                <span className="text-amber-200">{settings.hero_subtitle || 'To Your Table'}</span>
              </h1>
              <p className="text-xl text-amber-100 max-w-2xl mb-8">
                {settings.hero_description || 'Premium quality eggs and poultry products from Matugga\'s finest farm. Raised with care, delivered with love.'}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  size="lg" 
                  className="bg-white text-amber-700 hover:bg-amber-50 shadow-lg"
                  onClick={() => setOrderDialogOpen(true)}
                >
                  Order Now
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  View Products
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const { num, suffix } = parseStatValue(stat.value);
              return <AnimatedStat key={index} stat={stat} num={num} suffix={suffix} />;
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 bg-gradient-to-b from-white to-amber-50 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">Our Products</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Quality products from our farm, raised with the highest standards of care and hygiene.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden dark:bg-gray-800">
                {/* Product Image */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{product.title}</h3>
                    <p className="text-amber-200 text-sm">{product.price}</p>
                  </div>
                </div>
                <CardContent className="pt-6 bg-white dark:bg-gray-800">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{product.description}</p>
                  <ul className="space-y-2">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    onClick={() => setOrderDialogOpen(true)}
                  >
                    Order Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-6">
                Why Choose <span className="text-amber-600 dark:text-amber-400">Country Farm Matugga?</span>
              </h2>
              <div className="space-y-6">
                {[
                  { title: 'Quality Assured', desc: 'All our birds are vaccinated and raised in clean, spacious environments.' },
                  { title: 'Fresh Daily', desc: 'Eggs are collected fresh every day and delivered promptly to maintain quality.' },
                  { title: 'Fair Prices', desc: 'We offer competitive prices without compromising on quality.' },
                  { title: 'Reliable Delivery', desc: 'Fast and reliable delivery service within Kampala and surrounding areas.' },
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-gray-100">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              {/* Employee/Farmer Image */}
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={aboutImage?.url || "https://images.unsplash.com/photo-1594608661623-aa0bd3a69799?w=600&h=500&fit=crop"} 
                  alt="Farm Worker with Chickens"
                  className="w-full h-[450px] object-cover"
                />
              </div>
              {/* Stats overlay */}
              <div className="absolute -bottom-6 -right-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-amber-100 dark:border-amber-900/30">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">5+</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Years</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">500+</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Customers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farm Video Gallery Section */}
      <section id="gallery" className="py-20 bg-gradient-to-b from-white to-amber-50 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">See Our Farm in Action</h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Take a virtual tour of our farm and see how we raise healthy birds and collect fresh eggs every day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Dynamic videos from database or fallback to static */}
            {(videos.length > 0 ? videos.slice(0, 3) : [
              { id: 1, url: '/farm-video-1.mp4', title: 'Daily Operations', description: 'Our team at work' },
              { id: 2, url: '/farm-video-2.mp4', title: 'Egg Collection', description: 'Fresh eggs daily' },
              { id: 3, url: '/farm-video-3.mp4', title: 'Poultry House', description: 'Healthy environment' },
            ]).map((video, index) => (
              <div key={video.id || index} className="relative group rounded-2xl overflow-hidden shadow-xl bg-gray-900">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-64 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                >
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-semibold">{video.title || 'Farm Video'}</h3>
                  <p className="text-sm text-amber-200">{video.description || 'See our farm'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">What Our Customers Say</h2>
            <p className="text-gray-600 dark:text-gray-400">Trusted by hundreds of satisfied customers</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg dark:bg-gray-800">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <img 
                      src={testimonial.image || `https://i.pravatar.cc/100?img=${index + 10}`}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-amber-200 dark:border-amber-700"
                    />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-gray-100">{testimonial.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-600 to-orange-600 rounded-3xl p-8 md:p-12 text-white">
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Get In Touch</h2>
                <p className="text-amber-100 mb-8">
                  Ready to order? Have questions? Contact us today and we'll be happy to help!
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-amber-100 text-sm">Call Us</div>
                      <div className="font-semibold">{settings.phone_number || '+256 700 000 000'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-amber-100 text-sm">Email Us</div>
                      <div className="font-semibold">{settings.email || 'info@countryfarm.ug'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-amber-100 text-sm">Visit Us</div>
                      <div className="font-semibold">{settings.address || 'Matugga, Wakiso District, Uganda'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-gray-800 dark:text-gray-100">
                <h3 className="text-xl font-bold mb-4">Quick Order</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Call or WhatsApp us directly to place your order, or send us a message below.
                </p>
                <div className="space-y-4">
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12"
                    onClick={() => window.open(`tel:${settings.phone_number || '+256700000000'}`)}
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call Now
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full border-amber-600 text-amber-600 hover:bg-amber-50 h-12"
                    onClick={() => window.open(`https://wa.me/${(settings.whatsapp_number || settings.phone_number || '+256700000000').replace(/\D/g, '')}`)}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    WhatsApp Order
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Order Form Dialog */}
      <OrderFormDialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen} settings={settings} />

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Country Farm Matugga" className="w-14 h-14 object-contain" />
                <span className="font-bold text-xl">Country Farm Matugga</span>
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted source for fresh eggs and quality poultry products in Uganda. 
                Farm fresh, delivered with care.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#products" className="hover:text-white transition-colors">Products</a></li>
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#testimonials" className="hover:text-white transition-colors">Reviews</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>{settings.phone_number || '+256 700 000 000'}</li>
                <li>{settings.email || 'info@countryfarm.ug'}</li>
                <li>{settings.address || 'Matugga, Uganda'}</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Country Farm Matugga. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

