import { useState } from 'react';
import { useSuppliersStore, Supplier } from '@/hooks/useSuppliersStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { X, Search, Plus, Star, Award, Phone, Mail, Globe, Tag, Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SuppliersManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSupplier?: (supplier: Supplier) => void;
}

export default function SuppliersManagementModal({
  isOpen,
  onClose,
  onSelectSupplier
}: SuppliersManagementModalProps) {
  const { suppliers, addSupplier, toggleBestOffer, deleteSupplier } = useSuppliersStore();
  const { currentUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Estado del Formulario
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('China');
  const [productsInput, setProductsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isBestOffer, setIsBestOffer] = useState(false);

  if (!isOpen) return null;

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.offeredProducts.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('El nombre del proveedor es obligatorio');
      return;
    }

    const offeredProducts = productsInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    addSupplier({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      country: country.trim() || 'China',
      offeredProducts: offeredProducts.length > 0 ? offeredProducts : ['Inversores', 'Paneles Solares'],
      isBestOffer,
      rating: 4.8,
      notes: notes.trim() || undefined,
      createdBy: currentUser?.name || 'Usuario'
    });

    toast.success(`✅ Proveedor "${name}" incorporado con éxito.`);
    
    // Reset Form
    setName('');
    setPhone('');
    setEmail('');
    setCountry('China');
    setProductsInput('');
    setNotes('');
    setIsBestOffer(false);
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b2b63] border border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative text-white font-sans">
        
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Globe className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Directorio de Proveedores (Páginas Amarillas)</h2>
              <p className="text-xs text-white/70">Cualquier perfil puede incorporar proveedores y calificar la mejor oferta (Subasta)</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Bar & Search */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/5">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, país o producto..."
              className="w-full bg-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
            />
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto bg-[#FF6B35] hover:bg-orange-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus size={16} />
            {showAddForm ? 'Cancelar' : 'Incorporar Proveedor'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Add Supplier Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-white/10 border border-amber-500/30 rounded-2xl p-5 space-y-4 animate-fade-in shadow-xl">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Plus size={16} /> Alta de Nuevo Proveedor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-white/80 font-semibold mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Sunshine Solar Tech"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">País de Procedencia *</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-[#0b2b63] border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                  >
                    <option value="China">China 🇨🇳</option>
                    <option value="Panamá">Panamá 🇵🇦</option>
                    <option value="España">España 🇪🇸</option>
                    <option value="Cuba">Cuba 🇨🇺</option>
                    <option value="EE.UU.">EE.UU. 🇺🇸</option>
                    <option value="Otro">Otro País</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+86 138 0000 0000"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                  />
                </div>

                <div>
                  <label className="block text-white/80 font-semibold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ventas@proveedor.com"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-white/80 font-semibold mb-1">Productos Ofertados (separados por coma)</label>
                  <input
                    type="text"
                    value={productsInput}
                    onChange={(e) => setProductsInput(e.target.value)}
                    placeholder="Inversores, Paneles 550W, Baterías LiFePO4"
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-white/80 font-semibold mb-1">Notas / Condiciones de Subasta</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Detalles de garantía, flete o tiempos de entrega..."
                    className="w-full bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-[#00D9FF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <label className="flex items-center gap-2 text-xs text-amber-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isBestOffer}
                    onChange={(e) => setIsBestOffer(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-white/10 border-white/20 focus:ring-amber-400"
                  />
                  🏆 Marcar como "Mejor Oferta" en Subasta
                </label>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all active:scale-95"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          )}

          {/* Suppliers Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className={`bg-white/5 border rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between transition-all relative group ${
                  supplier.isBestOffer
                    ? 'border-amber-500/80 shadow-lg shadow-amber-500/10'
                    : 'border-white/15 hover:border-white/30'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <div>
                      <h4 className="font-bold text-base text-white flex items-center gap-2">
                        {supplier.name}
                        {supplier.isBestOffer && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/20 text-amber-300 font-black px-2 py-0.5 rounded-full border border-amber-500/40">
                            <Award size={12} /> MEJOR OFERTA
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-[#00D9FF] font-semibold flex items-center gap-1.5 mt-0.5">
                        <Globe size={13} /> Procedencia: {supplier.country}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleBestOffer(supplier.id)}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        supplier.isBestOffer
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-white/10 text-white/50 border-white/15 hover:text-amber-300'
                      }`}
                      title={supplier.isBestOffer ? 'Quitar Mejor Oferta' : 'Marcar como Mejor Oferta'}
                    >
                      <Star size={16} className={supplier.isBestOffer ? 'fill-slate-950' : ''} />
                    </button>
                  </div>

                  {/* Offered Products Pills */}
                  <div className="flex flex-wrap gap-1.5 my-3">
                    {supplier.offeredProducts.map((prod, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[11px] bg-white/10 text-white/90 px-2.5 py-0.5 rounded-lg border border-white/10">
                        <Tag size={11} className="text-amber-400" />
                        {prod}
                      </span>
                    ))}
                  </div>

                  {/* Notes */}
                  {supplier.notes && (
                    <p className="text-xs text-white/70 leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5 mb-3">
                      "{supplier.notes}"
                    </p>
                  )}
                </div>

                {/* Contact & Actions Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    {supplier.phone && (
                      <a href={`tel:${supplier.phone}`} className="flex items-center gap-1.5 text-white/80 hover:text-[#00D9FF]">
                        <Phone size={13} /> {supplier.phone}
                      </a>
                    )}
                    {supplier.email && (
                      <a href={`mailto:${supplier.email}`} className="flex items-center gap-1.5 text-white/80 hover:text-[#00D9FF] truncate max-w-[200px]">
                        <Mail size={13} /> {supplier.email}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectSupplier && (
                      <button
                        onClick={() => {
                          onSelectSupplier(supplier);
                          onClose();
                        }}
                        className="bg-[#00D9FF] hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all text-xs"
                      >
                        Seleccionar
                      </button>
                    )}

                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar proveedor ${supplier.name}?`)) {
                          deleteSupplier(supplier.id);
                          toast.success('Proveedor eliminado');
                        }
                      }}
                      className="p-1.5 rounded-xl hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                      title="Eliminar Proveedor"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
