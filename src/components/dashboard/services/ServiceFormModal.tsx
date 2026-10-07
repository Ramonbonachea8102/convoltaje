import React, { useState, useEffect } from 'react';
import { X, Wrench, DollarSign, Tag, AlertCircle } from 'lucide-react';
import { Service, CreateServiceInput, UpdateServiceInput, BillingPeriod } from '@/types/services';
import { toast } from 'sonner';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: CreateServiceInput | UpdateServiceInput) => Promise<void>;
  editingService?: Service | null;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingService,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<string>('none');
  const [badgeText, setBadgeText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingService) {
      setTitle(editingService.title || '');
      setDescription(editingService.description || '');
      setPrice(editingService.price != null ? editingService.price.toString() : '');
      setBillingPeriod(editingService.billingPeriod || 'none');
      setBadgeText(editingService.badgeText || '');
      setIsActive(editingService.isActive);
      setSortOrder(editingService.sortOrder != null ? editingService.sortOrder.toString() : '0');
      setErrors({});
    } else {
      setTitle('');
      setDescription('');
      setPrice('');
      setBillingPeriod('none');
      setBadgeText('');
      setIsActive(true);
      setSortOrder('0');
      setErrors({});
    }
  }, [editingService, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'El título del servicio es requerido';
    if (!description.trim()) newErrors.description = 'La descripción es requerida';
    if (!price || isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Ingrese un precio válido (mayor o igual a 0)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Corrige los errores antes de guardar');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateServiceInput | UpdateServiceInput = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        billingPeriod: billingPeriod === 'none' ? null : (billingPeriod as BillingPeriod),
        badgeText: badgeText.trim() || null,
        isActive,
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      await onSave(payload);
      toast.success(editingService ? 'Servicio actualizado' : 'Servicio creado exitosamente');
      onClose();
    } catch (err: any) {
      toast.error(`Error: ${err.message || 'No se pudo guardar el servicio'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#0b3c8f] border border-white/10 rounded-2xl shadow-2xl p-6 text-white my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Wrench className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio Complementario'}
              </h2>
              <p className="text-xs text-white/60">
                Configuración de tarifas, periodicidad y descripción oficial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Título del Servicio *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Aterramiento o Mantenimiento Semestral"
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
            />
            {errors.title && (
              <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.title}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
              Descripción del Servicio *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explica el alcance del trabajo técnico, componentes incluidos o garantías..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none resize-none"
            />
            {errors.description && (
              <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.description}
              </p>
            )}
          </div>

          {/* Precios y Periodicidad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Precio (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150.00"
                  className="w-full pl-7 pr-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
                />
              </div>
              {errors.price && (
                <p className="flex items-center gap-1 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Frecuencia / Facturación
              </label>
              <select
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#092d6e] border border-white/10 rounded-xl text-sm text-white focus:border-cyan-400 focus:outline-none cursor-pointer"
              >
                <option value="none">Pago Único (Sin período)</option>
                <option value="mes">Mensual (/mes)</option>
                <option value="año">Anual (/año)</option>
              </select>
            </div>
          </div>

          {/* Badge y Orden */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Badge / Etiqueta
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="Ej. Recomendado o Suscripción"
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase tracking-wider mb-1.5">
                Orden de Visualización
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Estado Activo */}
          <div className="pt-2 flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-xs font-bold text-white">Servicio Visible al Público</p>
              <p className="text-[11px] text-white/60">
                Determina si se publica en el catálogo web
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? 'bg-cyan-500' : 'bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Acciones */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white/70 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Guardando...' : editingService ? 'Actualizar Servicio' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
