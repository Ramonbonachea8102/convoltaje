import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, FileText, Image as ImageIcon, DollarSign, Calendar, Tag, AlertCircle, Trash2 } from 'lucide-react';
import { Offer, CreateOfferInput, UpdateOfferInput } from '@/types/offers';
import { storageService } from '@/lib/services/storageService';
import { toast } from 'sonner';

interface OfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (offerData: CreateOfferInput | UpdateOfferInput, tempFiles?: { imageFile?: File; pdfFile?: File }) => Promise<void>;
  editingOffer?: Offer | null;
}

export const OfferFormModal: React.FC<OfferFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingOffer,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [badgeText, setBadgeText] = useState('OFERTA ESPECIAL');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  // Archivos seleccionados localmente
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingOffer) {
      setTitle(editingOffer.title || '');
      setDescription(editingOffer.description || '');
      setOriginalPrice(editingOffer.originalPrice != null ? editingOffer.originalPrice.toString() : '');
      setOfferPrice(editingOffer.offerPrice != null ? editingOffer.offerPrice.toString() : '');
      setBadgeText(editingOffer.badgeText || 'OFERTA ESPECIAL');
      setIsActive(editingOffer.isActive);
      setStartDate(editingOffer.startDate ? editingOffer.startDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setEndDate(editingOffer.endDate ? editingOffer.endDate.split('T')[0] : '');
      setSortOrder(editingOffer.sortOrder != null ? editingOffer.sortOrder.toString() : '0');
      setImagePreview(editingOffer.imageUrl || editingOffer.imagePath || '');
      setImageFile(null);
      setPdfFile(null);
      setPdfName(editingOffer.pdfPath ? editingOffer.pdfPath.split('/').pop() || 'documento.pdf' : '');
      setErrors({});
    } else {
      // Estado inicial limpio
      setTitle('');
      setDescription('');
      setOriginalPrice('');
      setOfferPrice('');
      setBadgeText('OFERTA ESPECIAL');
      setIsActive(true);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setSortOrder('0');
      setImageFile(null);
      setImagePreview('');
      setPdfFile(null);
      setPdfName('');
      setErrors({});
    }
  }, [editingOffer, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = storageService.validateFile(file, false);
    if (!validation.valid) {
      toast.error(validation.error || 'Imagen inválida');
      return;
    }

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = storageService.validateFile(file, true);
    if (!validation.valid) {
      toast.error(validation.error || 'PDF inválido');
      return;
    }

    setPdfFile(file);
    setPdfName(file.name);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.pdf;
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'El título de la oferta es obligatorio.';
    }

    const numOffer = parseFloat(offerPrice);
    if (isNaN(numOffer) || numOffer < 0) {
      newErrors.offerPrice = 'Ingresa un precio de oferta válido mayor o igual a 0.';
    }

    if (originalPrice.trim() !== '') {
      const numOriginal = parseFloat(originalPrice);
      if (isNaN(numOriginal) || numOriginal < 0) {
        newErrors.originalPrice = 'El precio original debe ser mayor o igual a 0.';
      } else if (!isNaN(numOffer) && numOffer > numOriginal) {
        newErrors.offerPrice = 'El precio de oferta no puede ser mayor que el precio base original.';
      }
    }

    if (!editingOffer && !imageFile && !imagePreview) {
      newErrors.image = 'La imagen o flyer de la oferta es obligatoria.';
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        newErrors.endDate = 'La fecha de fin debe ser posterior a la fecha de inicio.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Revisa los campos del formulario.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateOfferInput | UpdateOfferInput = {
        title: title.trim(),
        description: description.trim() || null,
        originalPrice: originalPrice.trim() !== '' ? parseFloat(originalPrice) : null,
        offerPrice: parseFloat(offerPrice),
        currency: 'USD',
        badgeText: badgeText.trim() || 'OFERTA ESPECIAL',
        imagePath: editingOffer ? editingOffer.imagePath : '', // será asignado al subir
        pdfPath: editingOffer ? editingOffer.pdfPath : null,
        isActive,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      await onSave(payload, {
        imageFile: imageFile || undefined,
        pdfFile: pdfFile || undefined,
      });

      onClose();
    } catch (err: any) {
      console.error('Error al guardar la oferta:', err);
      toast.error(err.message || 'Error al procesar la oferta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0e2746] border border-cyan-500/20 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a1e36]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Tag size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingOffer ? 'Editar Oferta Comercial' : 'Crear Nueva Oferta Comercial'}
              </h3>
              <p className="text-xs text-slate-400">
                Administra promociones con flyer oficial, precios y ficha técnica.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Título de la oferta */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Título de la Oferta *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Sistema 3kW Base - Edición de Temporada"
              className="w-full bg-[#08182b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
          </div>

          {/* Precios y Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Precio Oferta (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="2450"
                  className="w-full bg-[#08182b] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-semibold"
                />
              </div>
              {errors.offerPrice && <p className="text-xs text-red-400 mt-1">{errors.offerPrice}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Precio Original (Tachado)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="2800"
                  className="w-full bg-[#08182b] border border-white/10 rounded-xl pl-8 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              {errors.originalPrice && <p className="text-xs text-red-400 mt-1">{errors.originalPrice}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Badge / Etiqueta
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="OFERTA ESPECIAL"
                className="w-full bg-[#08182b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase text-xs font-bold"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Descripción o Componentes Incluidos
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla lo que incluye la oferta, garantías especiales o requisitos de instalación..."
              className="w-full bg-[#08182b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 resize-none"
            />
          </div>

          {/* Subida de Imagen / Flyer */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Flyer o Imagen de la Oferta * (Máx. 15 MB)
            </label>
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            
            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#08182b] border border-dashed border-white/20">
              {imagePreview ? (
                <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-cyan-500/30 shrink-0 bg-slate-900">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-600 rounded-lg text-white hover:bg-red-700"
                    title="Quitar imagen"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <ImageIcon size={28} />
                </div>
              )}

              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs text-slate-300 font-medium">
                  {imageFile ? imageFile.name : (imagePreview ? 'Imagen actual vinculada' : 'Selecciona una imagen en formato JPG, PNG o WEBP')}
                </p>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all"
                >
                  <Upload size={13} />
                  <span>{imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}</span>
                </button>
              </div>
            </div>
            {errors.image && <p className="text-xs text-red-400 mt-1">{errors.image}</p>}
          </div>

          {/* Subida de Ficha Técnica PDF (Opcional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Documento o Ficha Técnica PDF (Opcional, Máx. 15 MB)
            </label>
            <input
              type="file"
              ref={pdfInputRef}
              onChange={handlePdfChange}
              accept="application/pdf"
              className="hidden"
            />
            
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#08182b] border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <FileText size={18} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {pdfName || 'Sin ficha técnica adjunta'}
                  </p>
                  <p className="text-[10px] text-slate-400">PDF con especificaciones para el cliente</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pdfName && (
                  <button
                    type="button"
                    onClick={() => {
                      setPdfFile(null);
                      setPdfName('');
                    }}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                    title="Eliminar PDF"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/10 transition-all"
                >
                  {pdfName ? 'Reemplazar' : 'Adjuntar PDF'}
                </button>
              </div>
            </div>
            {errors.pdf && <p className="text-xs text-red-400 mt-1">{errors.pdf}</p>}
          </div>

          {/* Fechas de Vigencia y Estado Activo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Fecha de Inicio *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-[#08182b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Fecha de Fin (Opcional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-[#08182b] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              />
              {errors.endDate && <p className="text-xs text-red-400 mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Orden de Clasificación y Switch de Activo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#08182b] border border-white/10">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Orden de aparición:
              </label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-20 bg-[#0e2746] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white text-center font-bold"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Oferta activa en la web</span>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  isActive ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    isActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#0a1e36]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : (editingOffer ? 'Guardar Cambios' : 'Crear Oferta')}
          </button>
        </div>

      </div>
    </div>
  );
};
