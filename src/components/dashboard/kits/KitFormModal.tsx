import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2, Image as ImageIcon, DollarSign, Check, AlertCircle } from 'lucide-react';
import { SolarKit, KitCategory } from '@/hooks/useKitsStore';
import { toast } from 'sonner';

interface KitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (kitData: {
    name: string;
    category: KitCategory;
    imageUrl: string;
    componentsSummary: string[];
    totalPrice: number;
    description?: string;
  }) => void;
  editingKit?: SolarKit | null;
}

const CATEGORIES: KitCategory[] = [
  'Residencial',
  'Comercial',
  'Personalizado',
  'Industrial',
  'Portátil'
];

const DEFAULT_IMAGE_FALLBACK = '/images/logoconvoltaje.jpg';

export const KitFormModal: React.FC<KitFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingKit
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<KitCategory>('Residencial');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [components, setComponents] = useState<string[]>(['']);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkComponentsText, setBulkComponentsText] = useState('');
  const [totalPrice, setTotalPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingKit) {
      setName(editingKit.name || '');
      setCategory(editingKit.category || 'Residencial');
      setImageUrl(editingKit.imageUrl || '');
      setImagePreviewError(false);
      const kitComponents = editingKit.componentsSummary?.length ? editingKit.componentsSummary : [''];
      setComponents(kitComponents);
      setBulkComponentsText(kitComponents.join('\n'));
      setTotalPrice(editingKit.totalPrice ? editingKit.totalPrice.toString() : '');
      setDescription(editingKit.description || '');
      setErrors({});
    } else {
      // Default clean state
      setName('');
      setCategory('Residencial');
      setImageUrl('');
      setImagePreviewError(false);
      setComponents(['', '']);
      setBulkComponentsText('');
      setTotalPrice('');
      setDescription('');
      setErrors({});
      setBulkMode(false);
    }
  }, [editingKit, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload -> convert to Data URL for instant preview & persistence
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor sube un archivo de imagen válido (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy pesada. Máximo recomendado: 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      setImagePreviewError(false);
      toast.success('Imagen cargada correctamente');
    };
    reader.onerror = () => {
      toast.error('Error al procesar el archivo.');
    };
    reader.readAsDataURL(file);
  };

  // Dynamic component bullet list handlers
  const handleComponentChange = (index: number, value: string) => {
    const updated = [...components];
    updated[index] = value;
    setComponents(updated);
  };

  const handleAddComponent = () => {
    setComponents([...components, '']);
  };

  const handleRemoveComponent = (index: number) => {
    if (components.length <= 1) {
      setComponents(['']);
      return;
    }
    setComponents(components.filter((_, i) => i !== index));
  };

  const handleToggleBulkMode = () => {
    if (!bulkMode) {
      // Switch from list to textarea
      setBulkComponentsText(components.filter(c => c.trim()).join('\n'));
    } else {
      // Switch from textarea to list
      const parsed = bulkComponentsText
        .split('\n')
        .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
        .filter(Boolean);
      setComponents(parsed.length > 0 ? parsed : ['']);
    }
    setBulkMode(!bulkMode);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre del kit es obligatorio.';
    }

    const numericPrice = parseFloat(totalPrice);
    if (!totalPrice || isNaN(numericPrice) || numericPrice <= 0) {
      newErrors.totalPrice = 'Ingresa un precio total válido (mayor a 0).';
    }

    const activeComponents = bulkMode
      ? bulkComponentsText.split('\n').map(s => s.trim()).filter(Boolean)
      : components.filter(c => c.trim());

    if (activeComponents.length === 0) {
      newErrors.components = 'Agrega al menos un componente incluido en el kit.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error('Por favor completa los campos requeridos correctamente.');
      return;
    }

    const finalComponents = bulkMode
      ? bulkComponentsText
          .split('\n')
          .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
          .filter(Boolean)
      : components.map(c => c.trim()).filter(Boolean);

    onSave({
      name: name.trim(),
      category,
      imageUrl: imageUrl.trim() || DEFAULT_IMAGE_FALLBACK,
      componentsSummary: finalComponents,
      totalPrice: parseFloat(totalPrice),
      description: description.trim()
    });

    toast.success(editingKit ? 'Kit solar actualizado exitosamente' : 'Nuevo kit solar creado');
    onClose();
  };

  const currentPreviewImage = imageUrl.trim() || DEFAULT_IMAGE_FALLBACK;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#0b3c8f] border border-white/15 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto text-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby="kit-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#082a66]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/15 border border-[#00D9FF]/30 text-[#00D9FF] flex items-center justify-center font-bold">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 id="kit-modal-title" className="text-lg font-bold text-white tracking-tight">
                {editingKit ? 'Editar Kit Solar' : 'Nuevo Kit Solar'}
              </h2>
              <p className="text-xs text-white/60">
                Configura los componentes, categoría y precio directo del paquete.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white flex items-center justify-center transition-colors"
            title="Cerrar modal"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
          
          {/* 1. Kit Name */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Nombre del Kit <span className="text-[#FF6B35]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Sistema 6K PLUS Residencial"
              className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50 transition-all ${
                errors.name ? 'border-red-400' : 'border-white/15'
              }`}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={13} /> {errors.name}
              </p>
            )}
          </div>

          {/* 2. Category */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Categoría del Kit <span className="text-[#FF6B35]">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[#00D9FF] text-[#0b1b33] border-[#00D9FF] shadow-sm shadow-[#00D9FF]/20'
                        : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Image URL or File Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider">
              Foto del Kit (URL o Subir Archivo)
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              {/* Image Preview */}
              <div className="sm:col-span-4 w-full h-32 rounded-xl bg-black/20 border border-white/10 overflow-hidden relative group flex items-center justify-center">
                {imageUrl && !imagePreviewError ? (
                  <img
                    src={currentPreviewImage}
                    alt="Vista previa del kit"
                    onError={() => setImagePreviewError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-white/40 p-2 text-center">
                    <ImageIcon size={28} className="mb-1 text-white/30" />
                    <span className="text-[11px]">Sin imagen asignada</span>
                  </div>
                )}
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('');
                      setImagePreviewError(false);
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/60 rounded-md text-white/80 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Quitar imagen"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* URL input and upload button */}
              <div className="sm:col-span-8 space-y-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImagePreviewError(false);
                  }}
                  placeholder="Pegar URL de la imagen (ej: /images/kit-10kw-equipo.jpg)"
                  className="w-full px-3.5 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50"
                />

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl text-xs font-semibold text-white transition-colors"
                  >
                    <Upload size={14} className="text-[#00D9FF]" />
                    <span>Subir desde dispositivo</span>
                  </button>
                  <span className="text-[11px] text-white/50">JPG, PNG o WebP</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Total Price (Numeric/Currency Field — Direct Custom Price) */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Precio Total del Kit (USD) <span className="text-[#FF6B35]">*</span>
            </label>
            <div className="relative max-w-xs">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#00D9FF] font-bold text-sm">
                $
              </span>
              <input
                type="number"
                min="0"
                step="1"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="6950"
                className={`w-full pl-8 pr-16 py-2.5 bg-white/5 border rounded-xl text-white font-bold text-base placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50 transition-all ${
                  errors.totalPrice ? 'border-red-400' : 'border-white/15'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 text-xs font-semibold">
                USD
              </span>
            </div>
            <p className="text-[11px] text-white/50 mt-1">
              Precio cerrado directo para el cliente (sin desglose forzado por ítem unitario).
            </p>
            {errors.totalPrice && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={13} /> {errors.totalPrice}
              </p>
            )}
          </div>

          {/* 5. Components Summary (Dynamic Bullet List or Multiline Textarea) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Resumen de Componentes Incluidos <span className="text-[#FF6B35]">*</span>
              </label>
              <button
                type="button"
                onClick={handleToggleBulkMode}
                className="text-[11px] text-[#00D9FF] hover:underline font-semibold"
              >
                {bulkMode ? 'Modo Lista Dinámica' : 'Modo Texto Multilínea'}
              </button>
            </div>

            {bulkMode ? (
              <div>
                <textarea
                  rows={5}
                  value={bulkComponentsText}
                  onChange={(e) => setBulkComponentsText(e.target.value)}
                  placeholder={`Inversor Híbrido MUST 6kW\n8 Paneles Solares 550W\nBatería LiFePO4 MUST 15kWh\nEstructura de montaje para techo\nKit de protecciones y cableado`}
                  className={`w-full px-4 py-2.5 bg-white/5 border rounded-xl text-white placeholder-white/40 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50 ${
                    errors.components ? 'border-red-400' : 'border-white/15'
                  }`}
                />
                <p className="text-[11px] text-white/50 mt-1">
                  Escribe un componente por línea. Se organizará automáticamente en viñetas.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {components.map((component, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center text-xs text-[#00D9FF] font-bold">•</span>
                    <input
                      type="text"
                      value={component}
                      onChange={(e) => handleComponentChange(idx, e.target.value)}
                      placeholder={`Componente ${idx + 1} (ej: Inversor MUST 6kW)`}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveComponent(idx)}
                      className="p-2 text-white/40 hover:text-red-400 transition-colors"
                      title="Eliminar ítem"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddComponent}
                  className="flex items-center gap-1.5 text-xs text-[#00D9FF] hover:text-[#00c5e6] font-semibold py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Plus size={14} />
                  <span>Añadir otro componente</span>
                </button>
              </div>
            )}

            {errors.components && (
              <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle size={13} /> {errors.components}
              </p>
            )}
          </div>

          {/* 6. Optional Description */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Notas Técnicas / Descripción para el Asesor (Opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Recomendado para viviendas con 1 aire de 12000 BTU funcionando 8h diarias y bombas de agua."
              className="w-full px-4 py-2 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50"
            />
          </div>

        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#082a66]/60 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium text-xs transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00D9FF] hover:bg-[#00c5e6] text-[#0b1b33] font-black text-xs transition-all shadow-md shadow-[#00D9FF]/20"
          >
            <Check size={16} />
            <span>{editingKit ? 'Guardar Cambios' : 'Crear Kit'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
