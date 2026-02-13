import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
    Plus, Search, Filter, ArrowUpDown, 
    TrendingUp, Package, AlertTriangle, 
    DollarSign, BarChart3, PieChart as PieChartIcon, 
    History, Edit, Trash2, Eye, MoreHorizontal,
    ArrowUpRight, ArrowDownRight, Activity, X,
    ChevronDown, ChevronUp, Download, RefreshCw,
    TrendingDown, Boxes
} from 'lucide-react';
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { 
    Select, SelectContent, SelectItem, 
    SelectTrigger, SelectValue 
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { format, subDays } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';

// --- Internal Components ---

const KPICard = ({ title, value, subValue, icon: Icon, colorClass, trend }) => (
    <Card className="overflow-hidden border-none bg-white/5 backdrop-blur-md">
        <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <h3 className="text-2xl font-bold mt-1 text-white">{value}</h3>
                    {subValue && <p className="text-xs text-gray-500 mt-1">{subValue}</p>}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            <span>{Math.abs(trend)}% from last month</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const InsightCard = ({ title, value, label, icon: Icon, trendType }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div className={`p-2 rounded-lg ${trendType === 'positive' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{title}</p>
            <p className="text-lg font-bold text-white leading-tight">{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
        </div>
    </div>
);

const Materials = () => {
    // --- State ---
    const [loading, setLoading] = useState(true);
    const [materials, setMaterials] = useState([]);
    const [projectMaterials, setProjectMaterials] = useState([]);
    const [usageStats, setUsageStats] = useState([]);
    
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [brandFilter, setBrandFilter] = useState('all');
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest');

    // Modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        unit_cost: '',
        unit_price: '',
        quantity_available: 0,
        reorder_level: 0
    });

    // --- Data Fetching ---
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            
            // 1. Fetch materials with stock
            const { data: materialsData, error: materialsError } = await supabase
                .from('materials')
                .select('*, inventory_stock(*)');
            
            if (materialsError) throw materialsError;

            // 2. Fetch usage from project_materials
            const { data: usageData, error: usageError } = await supabase
                .from('project_materials')
                .select('*');
            
            if (usageError) throw usageError;

            setMaterials(materialsData || []);
            setProjectMaterials(usageData || []);
            
            // Calculate usage stats (total quantity per material)
            const usageMap = (usageData || []).reduce((acc, curr) => {
                acc[curr.material_id] = (acc[curr.material_id] || 0) + parseFloat(curr.quantity);
                return acc;
            }, {});
            
            setUsageStats(usageMap);

        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error(error.message || "Failed to load data");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();

        // --- Realtime Subscriptions ---
        const materialsSub = supabase
            .channel('materials-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_stock' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'project_materials' }, () => fetchData())
            .subscribe();

        return () => {
            supabase.removeChannel(materialsSub);
        };
    }, [fetchData]);

    // --- Computed Data ---
    const filteredMaterials = useMemo(() => {
        return materials
            .filter(m => {
                const searchMatch = m.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                                  (m.brand && m.brand.toLowerCase().includes(debouncedSearch.toLowerCase()));
                const brandMatch = brandFilter === 'all' || m.brand === brandFilter;
                const stockMatch = !lowStockOnly || (m.inventory_stock?.[0]?.quantity_available <= m.inventory_stock?.[0]?.reorder_level);
                return searchMatch && brandMatch && stockMatch;
            })
            .sort((a, b) => {
                if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
                if (sortBy === 'name') return a.name.localeCompare(b.name);
                if (sortBy === 'stock_low') return (a.inventory_stock?.[0]?.quantity_available || 0) - (b.inventory_stock?.[0]?.quantity_available || 0);
                if (sortBy === 'stock_high') return (b.inventory_stock?.[0]?.quantity_available || 0) - (a.inventory_stock?.[0]?.quantity_available || 0);
                if (sortBy === 'cost_high') return parseFloat(b.unit_cost) - parseFloat(a.unit_cost);
                if (sortBy === 'profit_high') {
                    const profitA = parseFloat(a.unit_price) - parseFloat(a.unit_cost);
                    const profitB = parseFloat(b.unit_price) - parseFloat(b.unit_cost);
                    return profitB - profitA;
                }
                return 0;
            });
    }, [materials, debouncedSearch, brandFilter, lowStockOnly, sortBy]);

    const stats = useMemo(() => {
        const totalMaterials = materials.length;
        let totalInventoryValue = 0;
        let totalSalesValue = 0;
        let lowStockCount = 0;
        
        materials.forEach(m => {
            const stock = m.inventory_stock?.[0];
            const qty = parseFloat(stock?.quantity_available || 0);
            totalInventoryValue += qty * parseFloat(m.unit_cost);
            totalSalesValue += qty * parseFloat(m.unit_price);
            if (qty <= parseFloat(stock?.reorder_level || 0)) lowStockCount++;
        });

        const potentialProfit = totalSalesValue - totalInventoryValue;

        return {
            totalMaterials,
            totalInventoryValue,
            totalSalesValue,
            potentialProfit,
            lowStockCount
        };
    }, [materials]);

    const insights = useMemo(() => {
        if (!materials.length) return null;

        const mostExpensive = [...materials].sort((a, b) => parseFloat(b.unit_cost) - parseFloat(a.unit_cost))[0];
        const highestMargin = [...materials].sort((a, b) => {
            const marginA = parseFloat(a.unit_price) - parseFloat(a.unit_cost);
            const marginB = parseFloat(b.unit_price) - parseFloat(b.unit_cost);
            return marginB - marginA;
        })[0];

        const fastestUsedId = Object.entries(usageStats).sort((a, b) => b[1] - a[1])[0]?.[0];
        const fastestUsed = materials.find(m => m.id === fastestUsedId);

        return {
            mostExpensive,
            highestMargin,
            fastestUsed,
            fastestUsedQty: usageStats[fastestUsedId] || 0
        };
    }, [materials, usageStats]);

    const chartData = useMemo(() => {
        // 1. Stock Value Bar Chart
        const barData = materials
            .map(m => ({
                name: m.name.substring(0, 12) + (m.name.length > 12 ? '..' : ''),
                value: (m.inventory_stock?.[0]?.quantity_available || 0) * parseFloat(m.unit_cost)
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // 2. Brand Distribution Pie Chart
        const brandGroups = materials.reduce((acc, curr) => {
            const brand = curr.brand || 'Other';
            acc[brand] = (acc[brand] || 0) + 1;
            return acc;
        }, {});
        const pieData = Object.entries(brandGroups).map(([name, value]) => ({ name, value }));

        // 3. Inventory Updates Line Chart (Mock or derived from updated_at)
        // For line chart, we'll group inventory changes by date if available, 
        // or just show a trend of top items current stock value vs reorder levels.
        const lineData = materials.slice(0, 7).map(m => ({
            name: m.name.substring(0, 8),
            stock: m.inventory_stock?.[0]?.quantity_available || 0,
            level: m.inventory_stock?.[0]?.reorder_level || 0
        }));

        return { barData, pieData, lineData };
    }, [materials]);

    const brands = useMemo(() => {
        const unique = new Set(materials.map(m => m.brand).filter(Boolean));
        return Array.from(unique).sort();
    }, [materials]);

    // --- Handlers ---
    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { data: newMaterial, error: mError } = await supabase
                .from('materials')
                .insert([{
                    name: formData.name,
                    brand: formData.brand,
                    unit_cost: parseFloat(formData.unit_cost),
                    unit_price: parseFloat(formData.unit_price)
                }])
                .select()
                .single();

            if (mError) throw mError;

            const { error: sError } = await supabase
                .from('inventory_stock')
                .insert([{
                    material_id: newMaterial.id,
                    quantity_available: parseFloat(formData.quantity_available),
                    reorder_level: parseFloat(formData.reorder_level)
                }]);

            if (sError) throw sError;

            toast.success("Material added successfully!");
            setIsAddModalOpen(false);
            setFormData({ name: '', brand: '', unit_cost: '', unit_price: '', quantity_available: 0, reorder_level: 0 });
            fetchData();
        } catch (error) {
            toast.error(error.message || "Failed to add material");
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const { error: mError } = await supabase
                .from('materials')
                .update({
                    name: formData.name,
                    brand: formData.brand,
                    unit_cost: parseFloat(formData.unit_cost),
                    unit_price: parseFloat(formData.unit_price)
                })
                .eq('id', selectedMaterial.id);

            if (mError) throw mError;

            const { error: sError } = await supabase
                .from('inventory_stock')
                .update({
                    quantity_available: parseFloat(formData.quantity_available),
                    reorder_level: parseFloat(formData.reorder_level)
                })
                .eq('material_id', selectedMaterial.id);

            if (sError) throw sError;

            toast.success("Material updated successfully!");
            setIsEditModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.message || "Failed to update material");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setLoading(true);
            
            // Check if material is in projects
            const inProjects = projectMaterials.some(pm => pm.material_id === selectedMaterial.id);
            if (inProjects) {
                toast.error("Cannot delete material. It is used in existing projects.", { duration: 4000 });
                setIsDeleteModalOpen(false);
                return;
            }

            // Delete inventory_stock first
            const { error: sError } = await supabase
                .from('inventory_stock')
                .delete()
                .eq('material_id', selectedMaterial.id);

            if (sError) throw sError;

            const { error: mError } = await supabase
                .from('materials')
                .delete()
                .eq('id', selectedMaterial.id);

            if (mError) throw mError;

            toast.success("Material deleted successfully");
            setIsDeleteModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(error.message || "Delete failed");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (material) => {
        setSelectedMaterial(material);
        setFormData({
            name: material.name,
            brand: material.brand || '',
            unit_cost: material.unit_cost,
            unit_price: material.unit_price,
            quantity_available: material.inventory_stock?.[0]?.quantity_available || 0,
            reorder_level: material.inventory_stock?.[0]?.reorder_level || 0
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (material) => {
        setSelectedMaterial(material);
        setIsDeleteModalOpen(true);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // --- Render ---

    return (
        <div className="min-h-screen bg-transparent p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
                        <Boxes className="h-8 w-8 text-blue-500" />
                        Materials Hub
                    </h1>
                    <p className="text-gray-400 mt-1">Manage, analyze and track solar inventory real-time.</p>
                </div>
                <Button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Add Material
                </Button>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-2xl bg-white/5" />
                    ))
                ) : (
                    <>
                        <KPICard 
                            title="Total Materials" 
                            value={stats.totalMaterials} 
                            icon={Package} 
                            colorClass="bg-blue-500/10 text-blue-400"
                        />
                        <KPICard 
                            title="Inventory Value" 
                            value={`₹${stats.totalInventoryValue.toLocaleString()}`} 
                            icon={DollarSign} 
                            colorClass="bg-emerald-500/10 text-emerald-400"
                        />
                        <KPICard 
                            title="Expected Sales" 
                            value={`₹${stats.totalSalesValue.toLocaleString()}`} 
                            icon={TrendingUp} 
                            colorClass="bg-violet-500/10 text-violet-400"
                        />
                        <KPICard 
                            title="Potential Profit" 
                            value={`₹${stats.potentialProfit.toLocaleString()}`} 
                            subValue={`Margin: ${stats.totalInventoryValue > 0 ? ((stats.potentialProfit / stats.totalInventoryValue) * 100).toFixed(1) : 0}%`}
                            icon={Activity} 
                            colorClass="bg-orange-500/10 text-orange-400"
                        />
                        <KPICard 
                            title="Low Stock" 
                            value={stats.lowStockCount} 
                            icon={AlertTriangle} 
                            colorClass={stats.lowStockCount > 0 ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-gray-500/10 text-gray-400"}
                        />
                    </>
                )}
            </div>

            {/* Insights Row */}
            {!loading && insights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InsightCard 
                        title="Most Expensive" 
                        value={insights.mostExpensive?.name} 
                        label={`Cost: ₹${insights.mostExpensive?.unit_cost?.toLocaleString()}`}
                        icon={DollarSign}
                    />
                    <InsightCard 
                        title="Highest Profit Margin" 
                        value={insights.highestMargin?.name} 
                        label={`Profit: ₹${(insights.highestMargin?.unit_price - insights.highestMargin?.unit_cost)?.toLocaleString()}`}
                        icon={TrendingUp}
                        trendType="positive"
                    />
                    <InsightCard 
                        title="Fastest Used" 
                        value={insights.fastestUsed?.name || 'N/A'} 
                        label={`Usage: ${insights.fastestUsedQty} units`}
                        icon={Activity}
                    />
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* Analytics & Charts */}
                <div className="xl:col-span-1 space-y-6">
                    <Card className="border-none bg-white/5 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-blue-400" />
                                Inventory Value Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            {loading ? <Skeleton className="w-full h-full rounded-xl bg-white/5" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData.barData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-none bg-white/5 backdrop-blur-md">
                        <CardHeader>
                            <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-emerald-400" />
                                Distribution by Brand
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            {loading ? <Skeleton className="w-full h-full rounded-xl bg-white/5" /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData.pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {chartData.pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} formatter={(value) => <span className="text-xs text-slate-400">{value}</span>}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Materials List Table */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex flex-col gap-4">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                placeholder="Search materials or brands..." 
                                className="pl-10 bg-white/5 border-white/10 text-white h-11 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 lg:flex lg:items-center gap-2">
                            <div className="flex gap-2 col-span-2 lg:col-auto">
                                <Select value={brandFilter} onValueChange={setBrandFilter}>
                                    <SelectTrigger className="flex-1 lg:w-40 bg-white/5 border-white/10 text-white h-10">
                                        <Filter className="h-4 w-4 mr-2 hidden sm:block" />
                                        <SelectValue placeholder="Brand" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 text-white border-white/10">
                                        <SelectItem value="all">All Brands</SelectItem>
                                        {brands.map(brand => (
                                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger className="flex-1 lg:w-44 bg-white/5 border-white/10 text-white h-10">
                                        <ArrowUpDown className="h-4 w-4 mr-2 hidden sm:block" />
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 text-white border-white/10">
                                        <SelectItem value="newest">Newest First</SelectItem>
                                        <SelectItem value="name">Alphabetical</SelectItem>
                                        <SelectItem value="stock_low">Lowest Stock</SelectItem>
                                        <SelectItem value="stock_high">Highest Stock</SelectItem>
                                        <SelectItem value="cost_high">Highest Cost</SelectItem>
                                        <SelectItem value="profit_high">Highest Profit</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button 
                                variant={lowStockOnly ? "destructive" : "outline"}
                                className={lowStockOnly ? "flex-1 lg:flex-initial" : "flex-1 lg:flex-initial bg-white/5 border-white/10 text-white"}
                                onClick={() => setLowStockOnly(!lowStockOnly)}
                            >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Low Stock
                            </Button>

                            <Button 
                                variant="outline" 
                                className="w-12 h-10 bg-white/5 border-white/10 text-white flex items-center justify-center lg:flex-initial"
                                onClick={fetchData}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    <div className="glass-panel overflow-hidden border border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                        
                        {/* Mobile View - Card List */}
                        <div className="block md:hidden divide-y divide-white/10">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="p-4 space-y-2">
                                        <Skeleton className="h-6 w-3/4 bg-white/5" />
                                        <Skeleton className="h-4 w-1/2 bg-white/5" />
                                    </div>
                                ))
                            ) : filteredMaterials.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No materials found</div>
                            ) : (
                                filteredMaterials.map(m => {
                                    const stock = m.inventory_stock?.[0]?.quantity_available || 0;
                                    const reorderLevel = m.inventory_stock?.[0]?.reorder_level || 0;
                                    const isLow = stock <= reorderLevel;
                                    return (
                                        <div key={m.id} className="p-4 space-y-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-white">{m.name}</h4>
                                                    <p className="text-xs text-gray-400">{m.brand}</p>
                                                </div>
                                                <Badge className={isLow ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"}>
                                                    {isLow ? "LOW STOCK" : "IN STOCK"}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="text-gray-500">Stock: <span className="text-white font-semibold">{stock}</span></div>
                                                <div className="text-gray-500">Reorder: <span className="text-white font-semibold">{reorderLevel}</span></div>
                                                <div className="text-gray-500">Cost: <span className="text-white font-semibold">₹{m.unit_cost}</span></div>
                                                <div className="text-gray-500">Price: <span className="text-white font-semibold">₹{m.unit_price}</span></div>
                                            </div>
                                            <div className="flex gap-2 pt-2">
                                                <Button size="sm" variant="outline" className="flex-1 bg-white/5 border-white/10" onClick={() => openEditModal(m)}>Edit</Button>
                                                <Button size="sm" variant="destructive" className="flex-1 bg-red-500/20 text-red-500 hover:bg-red-500/30" onClick={() => openDeleteModal(m)}>Delete</Button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Desktop View - Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white/5">
                                    <TableRow className="border-white/10">
                                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Material Info</TableHead>
                                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Pricing (Unit)</TableHead>
                                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Profit Margin</TableHead>
                                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">Stock Status</TableHead>
                                        <TableHead className="text-gray-400 font-bold uppercase text-[10px] tracking-wider text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        Array(5).fill(0).map((_, i) => (
                                            <TableRow key={i} className="border-white/5">
                                                <TableCell colSpan={5}><Skeleton className="h-12 w-full bg-white/5" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredMaterials.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-40 text-center text-gray-500 italic">
                                                No materials found matching your criteria.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredMaterials.map(m => {
                                            const stock = m.inventory_stock?.[0]?.quantity_available || 0;
                                            const reorderLevel = m.inventory_stock?.[0]?.reorder_level || 0;
                                            const isLow = stock <= reorderLevel;
                                            const profit = parseFloat(m.unit_price) - parseFloat(m.unit_cost);
                                            const margin = parseFloat(m.unit_cost) > 0 ? (profit / parseFloat(m.unit_cost)) * 100 : 0;
                                            
                                            return (
                                                <TableRow key={m.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{m.name}</span>
                                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">{m.brand || 'No Brand'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-white">₹{parseFloat(m.unit_cost).toLocaleString()} <span className="text-[10px] text-slate-500">(Cost)</span></span>
                                                            <span className="text-[10px] text-slate-400">Retail: ₹{parseFloat(m.unit_price).toLocaleString()}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-emerald-400">₹{profit.toLocaleString()}</span>
                                                            <span className={`text-[10px] font-bold ${margin > 20 ? 'text-green-500' : 'text-slate-500'}`}>{margin.toFixed(1)}% Margin</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`h-2 w-2 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                                <span className="text-sm font-bold text-white">{stock} <span className="text-xs font-normal text-slate-500">units</span></span>
                                                            </div>
                                                            <Badge variant="outline" className={`w-fit text-[9px] py-0 border-none ${isLow ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                                                                {isLow ? `Low Stock (Level: ${reorderLevel})` : 'Healthy Level'}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 hover:bg-blue-500/10 text-blue-400"
                                                                onClick={() => openEditModal(m)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 hover:bg-red-500/10 text-red-400"
                                                                onClick={() => openDeleteModal(m)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    
                    {/* Usage Insights */}
                    <Card className="border-none bg-white/5 backdrop-blur-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-white font-bold flex items-center gap-2">
                                <History className="h-5 w-5 text-violet-400" />
                                Project Usage Analytics
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? <Skeleton className="h-20 w-full bg-white/5" /> : (
                                    Object.entries(usageStats).slice(0, 5).map(([id, qty]) => {
                                        const m = materials.find(mat => mat.id === id);
                                        if (!m) return null;
                                        return (
                                            <div key={id} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                                                        <Package className="h-4 w-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{m.name}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase">{m.brand}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-blue-400">{qty} Units</p>
                                                    <p className="text-[10px] text-slate-500">Total Consumption</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* --- Modals --- */}

            {/* Add/Edit Modal */}
            <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(val) => {
                if (!val) {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                }
            }}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-blue-400">
                            {isAddModalOpen ? 'New Material' : 'Edit Material'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-xs">
                            Please provide the material details and stock information.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={isAddModalOpen ? handleAddSubmit : handleEditSubmit} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="name">Material Name</Label>
                                <Input 
                                    id="name" 
                                    required 
                                    className="bg-white/5 border-white/10" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="brand">Brand</Label>
                                <Input 
                                    id="brand" 
                                    className="bg-white/5 border-white/10" 
                                    value={formData.brand} 
                                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit_cost">Unit Cost (₹)</Label>
                                <Input 
                                    id="unit_cost" 
                                    required 
                                    type="number" 
                                    className="bg-white/5 border-white/10" 
                                    value={formData.unit_cost} 
                                    onChange={(e) => setFormData({...formData, unit_cost: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit_price">Unit Price (₹)</Label>
                                <Input 
                                    id="unit_price" 
                                    required 
                                    type="number" 
                                    className="bg-white/5 border-white/10" 
                                    value={formData.unit_price} 
                                    onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Stock Available</Label>
                                <Input 
                                    id="quantity" 
                                    required 
                                    type="number" 
                                    className="bg-white/5 border-white/10" 
                                    value={formData.quantity_available} 
                                    onChange={(e) => setFormData({...formData, quantity_available: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="reorder">Reorder Level</Label>
                                <Input 
                                    id="reorder" 
                                    required 
                                    type="number" 
                                    className="bg-white/5 border-white/10" 
                                    value={formData.reorder_level} 
                                    onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                                />
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                className="text-slate-400 hover:text-white"
                                onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8" disabled={loading}>
                                {loading ? 'Saving...' : (isAddModalOpen ? 'Create Material' : 'Save Changes')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Confirm Deletion
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 pt-2 font-medium">
                            Are you sure you want to delete <span className="text-white font-bold">{selectedMaterial?.name}</span>? 
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-4 text-xs bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-red-400">
                        <p>• Linked inventory records will be removed.</p>
                        <p>• System will block deletion if material is linked to projects.</p>
                    </div>
                    <DialogFooter className="mt-6 flex flex-col md:flex-row gap-2">
                        <Button 
                            className="w-full md:flex-1 bg-white/5 border-white/10 text-white" 
                            variant="outline"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="w-full md:flex-1 bg-red-600 hover:bg-red-700 text-white font-bold" 
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            {loading ? 'Deleting...' : 'Delete Permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default Materials;
