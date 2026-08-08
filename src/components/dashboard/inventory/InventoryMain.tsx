import { useState } from 'react';
import { Package, Search, AlertTriangle, TrendingUp, DollarSign, Layers, Box, Globe, Plus, Download, Upload, ArrowRightLeft, ShieldAlert, Sparkles, Check, Flame, X, Tag } from 'lucide-react';
import { useInventoryStore, InventoryItem, ProductCategory } from '@/hooks/useInventoryStore';
import { useSuppliersStore } from '@/hooks/useSuppliersStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import PedidosPendientes from './PedidosPendientes';
import SuppliersManagementModal from '../suppliers/SuppliersManagementModal';
import { toast } from 'sonner';

const CATEGORIES: ProductCategory[] = ['Inversores', 'Paneles Solares', 'Baterías', 'Estructuras', 'Accesorios'];
const LOCATIONS = ['Almacén Central Habana', 'Almacén Taller Santiago', 'Vehículo Técnico 1', 'Móvil Repuesto Habana'];

export default function InventoryMain() {
  const { items, movements, recordPurchase, approveAndPriceItem, transferStock, liquidateStock, exterminateStock, reimportStock } = useInventoryStore();
  const { suppliers } = useSuppliersStore();
  const { currentUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'pedidos' | 'movements'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Modales
  const [showSuppliersModal, setShowSuppliersModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState<InventoryItem | null>(null);
  const [showCsvImportModal, setShowCsvImportModal] = useState(false);

  // Formulario Registro de Compra (Comprador)
  const [purchaseCode, setPurchaseCode] = useState('');
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseCategory, setPurchaseCategory] = useState<ProductCategory>('Inversores');
  const [purchaseBrand, setPurchaseBrand] = useState('');
  const [purchaseQty, setPurchaseQty] = useState<number>(10);
  const [purchaseUnitCost, setPurchaseUnitCost] = useState<number>(100);
  const [purchaseLocation, setPurchaseLocation] = useState('Almacén Central Habana');
  const [purchaseCountry, setPurchaseCountry] = useState('China');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Formulario Aprobación Precio (Designado)
  const [salePriceInput, setSalePriceInput] = useState<number>(0);
  const [laborPriceInput, setLaborPriceInput] = useState<number>(0);

  // Formulario Traslado
  const [transferItemId, setTransferItemId] = useState('');
  const [fromLoc, setFromLoc] = useState('Almacén Central Habana');
  const [toLoc, setToLoc] = useState('Almacén Taller Santiago');
  const [transferQty, setTransferQty] = useState<number>(1);

  // ─── Métricas de Inventario ──────────────────
  const totalStockCount = items.reduce((sum, i) => sum + i.stock, 0);
  const totalCostValue = items.reduce((sum, i) => sum + (i.stock * i.costPrice), 0);
  
  // Alerta de reposición al <= 30% del stock inicial
  const lowStockItems = items.filter(i => i.stock <= (i.initialStock ? i.initialStock * 0.3 : i.minStock));
  const pendingPricingItems = items.filter(i => i.status === 'pendiente_precio');

  // Filtrado de Tabla
  const filteredItems = items.filter(i => {
    const matchesCategory = selectedCategory === 'all' || i.category === selectedCategory;
    const matchesLocation = selectedLocation === 'all' || i.storageLocation === selectedLocation;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          i.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (i.brand && i.brand.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesLocation && matchesSearch;
  });

  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseCode || !purchaseName) {
      toast.error('Código y nombre del producto son requeridos');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === selectedSupplierId);

    recordPurchase({
      code: purchaseCode.trim(),
      name: purchaseName.trim(),
      category: purchaseCategory,
      brand: purchaseBrand.trim() || undefined,
      quantity: Number(purchaseQty),
      unitCost: Number(purchaseUnitCost),
      storageLocation: purchaseLocation,
      countryOfOrigin: purchaseCountry,
      supplierId: selectedSupplierId || undefined,
      supplierName: supplierObj?.name || 'Proveedor Directo',
      createdBy: currentUser?.name || 'Comprador'
    });

    toast.success(`🛒 Compra de ${purchaseQty} uds de "${purchaseName}" registrada como 'pendiente_precio'.`);
    setShowPurchaseModal(false);
    
    // Reset Form
    setPurchaseCode('');
    setPurchaseName('');
    setPurchaseBrand('');
    setPurchaseQty(10);
    setPurchaseUnitCost(100);
  };

  const handlePricingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPricingModal) return;

    approveAndPriceItem(showPricingModal.id, Number(salePriceInput), Number(laborPriceInput));
    toast.success(`✅ Producto "${showPricingModal.name}" activado con Precio de Venta: $${salePriceInput} USD.`);
    setShowPricingModal(null);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferItemId || fromLoc === toLoc) {
      toast.error('Selecciona ubicaciones válidas distintas');
      return;
    }

    transferStock(transferItemId, fromLoc, toLoc, Number(transferQty), currentUser?.name || 'Usuario');
    toast.success(`🚚 Traslado de ${transferQty} uds completado.`);
    setShowTransferModal(false);
  };

  // Descargar Plantilla CSV para José
  const handleDownloadCsvTemplate = () => {
    const csvContent = "code,name,category,brand,stock,costPrice,salePrice,storageLocation,countryOfOrigin\n" +
      "INV-DEYE-5KW,Inversor Deye 5kW,Inversores,Deye,10,800,1200,Almacén Central Habana,China\n" +
      "PAN-JINKO-550,Panel Solar Jinko 550W,Paneles Solares,Jinko,50,150,220,Almacén Central Habana,China";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_inventario_convoltaje.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('📄 Plantilla CSV de inventario descargada.');
  };

  return (
    <div className="w-full min-h-screen bg-[#0b3c8f] text-white p-4 md:p-6 font-sans relative">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Package className="text-[#00D9FF] w-8 h-8" />
            Gestión de Inventario & Almacenes
          </h1>
          <p className="text-xs md:text-sm text-white/70 mt-1">
            Modelo de Almacén con trazabilidad de compras, traslados y alerta al &lt;= 30%
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSuppliersModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Globe size={16} /> Páginas Amarillas (Proveedores)
          </button>

          <button
            onClick={() => setShowPurchaseModal(true)}
            className="bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus size={16} /> Registrar Compra (Comprador)
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <ArrowRightLeft size={16} className="text-[#00D9FF]" /> Traslado entre Áreas
          </button>

          <button
            onClick={() => setShowCsvImportModal(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 transition-all active:scale-95"
          >
            <Upload size={16} className="text-[#00D9FF]" /> Importar CSV
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'inventory'
              ? 'border-[#00D9FF] text-[#00D9FF]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Layers size={16} /> Catálogo de Inventario ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('pedidos')}
          className={`px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pedidos'
              ? 'border-[#00D9FF] text-[#00D9FF]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Box size={16} /> Pedidos Pendientes
        </button>

        <button
          onClick={() => setActiveTab('movements')}
          className={`px-5 py-3 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'movements'
              ? 'border-[#00D9FF] text-[#00D9FF]'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <TrendingUp size={16} /> Historial de Movimientos ({movements.length})
        </button>
      </div>

      {/* Content for Pedidos Pendientes */}
      {activeTab === 'pedidos' && <PedidosPendientes />}

      {/* Content for Inventory */}
      {activeTab === 'inventory' && (
        <>
          {/* Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white/70">Unidades Físicas en Stock</span>
                <Box size={20} className="text-[#00D9FF]" />
              </div>
              <p className="text-2xl font-black text-white">{totalStockCount} <span className="text-xs font-normal text-white/60">uds</span></p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white/70">Valor Invertido (Costo Total)</span>
                <DollarSign size={20} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-400">${totalCostValue.toLocaleString()} <span className="text-xs font-normal text-white/60">USD</span></p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white/70">Alertas de Reposición (&lt;= 30%)</span>
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <p className="text-2xl font-black text-red-400">{lowStockItems.length} <span className="text-xs font-normal text-white/60">ítems críticos</span></p>
            </div>

            <div className="bg-white/10 border border-white/15 rounded-2xl p-4 backdrop-blur-md">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-white/70">Pendientes de Asignar Precio</span>
                <Tag size={20} className="text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-400">{pendingPricingItems.length} <span className="text-xs font-normal text-white/60">borradores</span></p>
            </div>
          </div>

          {/* Banner de Alerta al 30% */}
          {lowStockItems.length > 0 && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 backdrop-blur-md animate-fade-in">
              <div className="flex items-center gap-3">
                <ShieldAlert className="text-red-400 w-6 h-6 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-red-200">⚠️ ALERTA AUTOMÁTICA DE COMPRA (&lt;= 30% Stock Inicial)</h4>
                  <p className="text-xs text-white/80">
                    Los siguientes productos alcanzaron el límite crítico: {lowStockItems.map(i => i.name).join(', ')}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shrink-0 shadow-md"
              >
                Reordenar
              </button>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por código, nombre o marca..."
                className="w-full bg-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#0b2b63] text-white text-xs font-semibold px-3 py-2.5 rounded-xl border border-white/15 focus:outline-none"
              >
                <option value="all">Todas las Categorías</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-[#0b2b63] text-white text-xs font-semibold px-3 py-2.5 rounded-xl border border-white/15 focus:outline-none"
              >
                <option value="all">Todas las Áreas</option>
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/10 text-white/70 uppercase tracking-wider font-bold border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Código / Ítem</th>
                    <th className="p-3.5">Categoría & Marca</th>
                    <th className="p-3.5">Área de Almacén</th>
                    <th className="p-3.5">Procedencia & Proveedor</th>
                    <th className="p-3.5">Stock / Alerta (&lt;=30%)</th>
                    <th className="p-3.5">Precio Costo vs Venta</th>
                    <th className="p-3.5 text-right">Acciones (Modelo José)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white/90">
                  {filteredItems.map((item) => {
                    const isLow = item.stock <= (item.initialStock ? item.initialStock * 0.3 : item.minStock);
                    const isDraft = item.status === 'pendiente_precio';

                    return (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-bold">
                          <p className="text-white text-sm">{item.name}</p>
                          <span className="text-[10px] text-[#00D9FF] font-mono">{item.code}</span>
                        </td>

                        <td className="p-3.5">
                          <p className="font-semibold">{item.category}</p>
                          <p className="text-[11px] text-white/60">{item.brand || 'Marca Genérica'}</p>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-white/10">
                            <Box size={12} className="text-[#00D9FF]" />
                            {item.storageLocation || 'Almacén Central Habana'}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <p className="font-semibold text-amber-300">📍 {item.countryOfOrigin || 'China'}</p>
                          <p className="text-[11px] text-white/60 truncate max-w-[150px]">{item.supplierName || 'Proveedor Directo'}</p>
                        </td>

                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                              isLow
                                ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {item.stock} / {item.initialStock || item.stock} uds
                            </span>
                            {isLow && (
                              <span className="text-[10px] bg-red-600 text-white font-extrabold px-1.5 py-0.5 rounded-md">
                                REPO 30%
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <p className="text-white/60">Costo: <span className="font-bold text-white">${item.costPrice} USD</span></p>
                          {isDraft ? (
                            <span className="inline-block text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-md border border-amber-500/30 mt-1">
                              Pendiente Precio (Designado)
                            </span>
                          ) : (
                            <p className="text-emerald-400 font-bold">Venta: ${item.salePrice} USD</p>
                          )}
                        </td>

                        <td className="p-3.5 text-right space-x-1">
                          {isDraft ? (
                            <button
                              onClick={() => {
                                setShowPricingModal(item);
                                setSalePriceInput(Math.ceil(item.costPrice * 1.4));
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] px-3 py-1.5 rounded-xl shadow-md transition-all"
                            >
                              Asignar Precio (Designado)
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  const qty = Number(prompt(`Cantidad a liquidar (a precio de costo $${item.costPrice} USD):`, '1'));
                                  if (qty > 0) liquidateStock(item.id, qty, currentUser?.name || 'Usuario');
                                }}
                                className="bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg border border-white/10"
                                title="Liquidación (Venta a Costo)"
                              >
                                Liquidar
                              </button>

                              <button
                                onClick={() => {
                                  const qty = Number(prompt(`Cantidad a exterminar (baja por pérdida/daño):`, '1'));
                                  if (qty > 0) exterminateStock(item.id, qty, currentUser?.name || 'Usuario');
                                }}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-[10px] px-2.5 py-1 rounded-lg border border-red-500/30"
                                title="Exterminación (Baja sin Retorno)"
                              >
                                Exterminar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Content for Movements History */}
      {activeTab === 'movements' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md p-4">
          <h3 className="text-base font-bold text-white mb-4">Historial de Movimientos Auditoría</h3>
          <div className="space-y-3">
            {movements.length === 0 ? (
              <p className="text-xs text-white/60 text-center py-6">No hay movimientos registrados de compras o traslados.</p>
            ) : (
              movements.map((mov) => (
                <div key={mov.id} className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-[#00D9FF] capitalize">[{mov.type}]</span>
                    <span className="text-white ml-2">{mov.notes || `Movimiento de ${mov.quantity} unidades`}</span>
                    <p className="text-[10px] text-white/50 mt-0.5">Por: {mov.createdBy} • {new Date(mov.date).toLocaleString()}</p>
                  </div>
                  <span className="font-bold text-emerald-400">${mov.totalCost} USD</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal Registrar Compra (Comprador) */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative text-white font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus size={20} className="text-[#FF6B35]" /> Registrar Compra de Almacén (Rol Comprador)
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-white/70 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-white/80 font-semibold mb-1">Código Único de Ítem *</label>
                <input
                  type="text"
                  required
                  value={purchaseCode}
                  onChange={(e) => setPurchaseCode(e.target.value)}
                  placeholder="Ej. INV-DEYE-10KW"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                />
              </div>

              <div>
                <label className="block text-white/80 font-semibold mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={purchaseName}
                  onChange={(e) => setPurchaseName(e.target.value)}
                  placeholder="Ej. Inversor Híbrido Deye 10kW Tri"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-semibold mb-1">Categoría</label>
                  <select
                    value={purchaseCategory}
                    onChange={(e) => setPurchaseCategory(e.target.value as any)}
                    className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">Marca</label>
                  <input
                    type="text"
                    value={purchaseBrand}
                    onChange={(e) => setPurchaseBrand(e.target.value)}
                    placeholder="Ej. Deye / EG4"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-semibold mb-1">Cantidad Comprada</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">Costo Unitario (USD)</label>
                  <input
                    type="number"
                    min="1"
                    value={purchaseUnitCost}
                    onChange={(e) => setPurchaseUnitCost(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-semibold mb-1">Área Destino</label>
                  <select
                    value={purchaseLocation}
                    onChange={(e) => setPurchaseLocation(e.target.value)}
                    className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">Procedencia</label>
                  <select
                    value={purchaseCountry}
                    onChange={(e) => setPurchaseCountry(e.target.value)}
                    className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="China">China 🇨🇳</option>
                    <option value="Panamá">Panamá 🇵🇦</option>
                    <option value="Cuba">Cuba 🇨🇺</option>
                    <option value="España">España 🇪🇸</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/80 font-semibold mb-1">Proveedor (Páginas Amarillas)</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">Proveedor Directo / Sin Registrar</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isBestOffer ? '🏆 (Mejor Oferta)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-[#FF6B35] hover:bg-orange-600 text-white font-bold px-5 py-2 rounded-xl shadow-lg"
                >
                  Registrar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aprobación de Precio (Designado) */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-white font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Tag size={20} className="text-amber-400" /> Fijar Precio & Mano de Obra (Designado)
              </h3>
              <button onClick={() => setShowPricingModal(null)} className="text-white/70 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePricingSubmit} className="space-y-4 text-xs">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <p className="font-bold text-sm text-white">{showPricingModal.name}</p>
                <p className="text-white/60">Costo de Ingreso: <span className="font-bold text-emerald-400">${showPricingModal.costPrice} USD</span></p>
              </div>

              <div>
                <label className="block text-white/80 font-semibold mb-1">Precio de Venta al Público ($ USD)</label>
                <input
                  type="number"
                  required
                  min={showPricingModal.costPrice}
                  value={salePriceInput}
                  onChange={(e) => setSalePriceInput(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white text-base font-bold focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-white/80 font-semibold mb-1">Precio de Mano de Obra / Instalación ($ USD)</label>
                <input
                  type="number"
                  value={laborPriceInput}
                  onChange={(e) => setLaborPriceInput(Number(e.target.value))}
                  placeholder="Ej. $150 USD"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPricingModal(null)}
                  className="bg-white/10 text-white font-bold px-4 py-2 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2 rounded-xl shadow-lg"
                >
                  Activar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Traslado entre Áreas */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-white font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowRightLeft size={20} className="text-[#00D9FF]" /> Traslado de Mercancía entre Áreas
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-white/70 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-white/80 font-semibold mb-1">Seleccionar Producto</label>
                <select
                  value={transferItemId}
                  onChange={(e) => setTransferItemId(e.target.value)}
                  className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white"
                >
                  <option value="">-- Elige un ítem --</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.stock})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/80 font-semibold mb-1">Área Origen</label>
                  <select value={fromLoc} onChange={(e) => setFromLoc(e.target.value)} className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white">
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">Área Destino</label>
                  <select value={toLoc} onChange={(e) => setToLoc(e.target.value)} className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white">
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/80 font-semibold mb-1">Cantidad a Trasladar</label>
                <input
                  type="number"
                  min="1"
                  value={transferQty}
                  onChange={(e) => setTransferQty(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowTransferModal(false)} className="bg-white/10 text-white font-bold px-4 py-2 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="bg-[#00D9FF] hover:bg-cyan-400 text-slate-950 font-black px-5 py-2 rounded-xl shadow-lg">
                  Ejecutar Traslado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Importar CSV */}
      {showCsvImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative text-white font-sans text-center">
            <div className="flex justify-between items-center mb-4 text-left">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload size={20} className="text-[#00D9FF]" /> Importar Inventario CSV
              </h3>
              <button onClick={() => setShowCsvImportModal(false)} className="text-white/70 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-white/70 mb-4">
              Subí un archivo CSV con las columnas estándar de inventario para cargar productos masivamente.
            </p>

            <button
              onClick={handleDownloadCsvTemplate}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs py-2.5 px-4 rounded-xl mb-4 flex items-center justify-center gap-2"
            >
              <Download size={16} className="text-[#00D9FF]" /> Descargar Plantilla CSV de Ejemplo
            </button>

            <input
              type="file"
              accept=".csv"
              onChange={() => {
                toast.success('✅ Carga CSV simulada correctamente.');
                setShowCsvImportModal(false);
              }}
              className="w-full bg-white/10 border border-white/15 rounded-xl p-3 text-xs text-white cursor-pointer"
            />

            <button
              onClick={() => setShowCsvImportModal(false)}
              className="w-full bg-[#00D9FF] text-slate-950 font-bold py-2.5 rounded-xl mt-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Directorio de Proveedores */}
      <SuppliersManagementModal
        isOpen={showSuppliersModal}
        onClose={() => setShowSuppliersModal(false)}
      />

    </div>
  );
}
