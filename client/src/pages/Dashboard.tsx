import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi, poultryApi, salesApi, customersApi, ordersApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Egg, Bird, Users, DollarSign, TrendingUp, TrendingDown, 
  Package, Heart, Utensils, LogOut, Home, Plus,
  BarChart3, Activity, AlertCircle, Calendar, Settings, Image, ShoppingCart
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PoultryTab } from '@/components/dashboard/PoultryTab';
import { SalesTab } from '@/components/dashboard/SalesTab';
import { CustomersTab } from '@/components/dashboard/CustomersTab';
import { EggProductionTab } from '@/components/dashboard/EggProductionTab';
import { HealthRecordsTab } from '@/components/dashboard/HealthRecordsTab';
import { FeedRecordsTab } from '@/components/dashboard/FeedRecordsTab';
import { ExpensesTab } from '@/components/dashboard/ExpensesTab';
import { SiteSettingsTab } from '@/components/dashboard/SiteSettingsTab';
import { MediaTab } from '@/components/dashboard/MediaTab';
import { OrdersTab } from '@/components/dashboard/OrdersTab';

interface DashboardStats {
  poultry: { totalBirds: number; activeBatches: number; recentMortality: number };
  eggs: { weeklyProduction: number; weeklyBroken: number; todayProduction: number };
  sales: { totalRevenue: number; monthRevenue: number; pendingPayments: number };
  expenses: { totalExpenses: number; monthExpenses: number };
  customers: { total: number; newThisMonth: number };
  feed: { monthUsage: number; monthCost: number };
  orders: { total: number; newOrders: number; revenue: number; thisMonth: number };
  profit: { monthly: number; total: number };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user, logout, isEmployee } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [newOrderCount, setNewOrderCount] = useState(0);

  useEffect(() => {
    if (!isEmployee) {
      setLocation('/');
      return;
    }
    fetchStats();
    fetchNewOrderCount();
  }, [isEmployee]);

  async function fetchNewOrderCount() {
    try {
      const response = await ordersApi.getNewCount();
      setNewOrderCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch order count:', error);
    }
  }

  async function fetchStats() {
    try {
      setStatsError(false);
      setLoading(true);
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStatsError(true);
    } finally {
      setLoading(false);
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-UG', { 
      style: 'currency', 
      currency: 'UGX',
      minimumFractionDigits: 0 
    }).format(amount);
  };

  if (!isEmployee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="Country Farm Matugga" className="w-16 h-16 object-contain" />
              <div>
                <h1 className="font-bold text-gray-800 dark:text-white">Country Farm Dashboard</h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Employee Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.full_name} <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full ml-1">{user?.role}</span>
              </span>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLocation('/')}
                className="text-gray-600"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => logout()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-900 border dark:border-gray-800 shadow-sm p-1 h-auto flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <BarChart3 className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="poultry" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Bird className="w-4 h-4 mr-2" />
              Poultry
            </TabsTrigger>
            <TabsTrigger value="eggs" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Egg className="w-4 h-4 mr-2" />
              Egg Production
            </TabsTrigger>
            <TabsTrigger value="feed" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Utensils className="w-4 h-4 mr-2" />
              Feed Records
            </TabsTrigger>
            <TabsTrigger value="health" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Heart className="w-4 h-4 mr-2" />
              Health Records
            </TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="customers" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Users className="w-4 h-4 mr-2" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="expenses" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Package className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 relative">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
              {newOrderCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {newOrderCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Image className="w-4 h-4 mr-2" />
              Media
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <Settings className="w-4 h-4 mr-2" />
              Site Content
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
              </div>
            ) : statsError ? (
              <Card className="border-0 shadow-md dark:bg-gray-900">
                <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                  <AlertCircle className="w-12 h-12 text-amber-500" />
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Unable to load dashboard data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">There was a problem fetching the statistics. Please try again.</p>
                  </div>
                  <Button onClick={() => fetchStats()} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Activity className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-amber-100">Total Birds</CardDescription>
                      <CardTitle className="text-3xl">{stats!.poultry.totalBirds.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-amber-100">
                        <Bird className="w-4 h-4 mr-1" />
                        <span className="text-sm">{stats!.poultry.activeBatches} active batches</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-amber-100">Today's Eggs</CardDescription>
                      <CardTitle className="text-3xl">{stats!.eggs.todayProduction.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-amber-100">
                        <Egg className="w-4 h-4 mr-1" />
                        <span className="text-sm">{stats!.eggs.weeklyProduction.toLocaleString()} this week</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-blue-100">Month Revenue</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(stats!.sales.monthRevenue)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-blue-100">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="text-sm">{formatCurrency(stats!.sales.pendingPayments)} pending</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-purple-100">Monthly Profit</CardDescription>
                      <CardTitle className="text-2xl">{formatCurrency(stats!.profit.monthly)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-purple-100">
                        {stats!.profit.monthly >= 0 ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-sm">Total: {formatCurrency(stats!.profit.total)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Secondary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md dark:bg-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-600" />
                        Customers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats!.customers.total}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Total customers</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-amber-600">+{stats!.customers.newThisMonth}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md dark:bg-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-amber-600" />
                        Feed Usage
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats!.feed.monthUsage.toLocaleString()} kg</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">This month</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-amber-600">{formatCurrency(stats!.feed.monthCost)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Cost</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Health Alerts
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats!.poultry.recentMortality}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">30-day mortality</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-400">{stats!.eggs.weeklyBroken}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Broken eggs (week)</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Orders Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                    <CardHeader className="pb-2">
                      <CardDescription className="text-emerald-100">Total Orders</CardDescription>
                      <CardTitle className="text-3xl">{stats!.orders.total}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-emerald-100">
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        <span className="text-sm">{stats!.orders.thisMonth} this month</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md dark:bg-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-emerald-600" />
                        New Orders
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{stats!.orders.newOrders}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Pending review</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab('orders')}
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        >
                          View All
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md dark:bg-gray-900">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                        Orders Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{formatCurrency(stats!.orders.revenue)}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Confirmed orders</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card className="border-0 shadow-md dark:bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                    <CardDescription>Common tasks you can perform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button 
                        onClick={() => setActiveTab('eggs')} 
                        variant="outline" 
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200"
                      >
                        <Egg className="w-6 h-6 text-amber-600" />
                        <span>Record Eggs</span>
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('sales')} 
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-amber-50 hover:border-amber-200"
                      >
                        <DollarSign className="w-6 h-6 text-amber-600" />
                        <span>New Sale</span>
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('feed')} 
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200"
                      >
                        <Utensils className="w-6 h-6 text-blue-600" />
                        <span>Record Feed</span>
                      </Button>
                      <Button 
                        onClick={() => setActiveTab('health')} 
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-red-50 hover:border-red-200"
                      >
                        <Heart className="w-6 h-6 text-red-500" />
                        <span>Health Record</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="poultry">
            <PoultryTab />
          </TabsContent>

          <TabsContent value="eggs">
            <EggProductionTab />
          </TabsContent>

          <TabsContent value="feed">
            <FeedRecordsTab />
          </TabsContent>

          <TabsContent value="health">
            <HealthRecordsTab />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab onNewOrderCountChange={setNewOrderCount} />
          </TabsContent>

          <TabsContent value="media">
            <MediaTab />
          </TabsContent>

          <TabsContent value="settings">
            <SiteSettingsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

