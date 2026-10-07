import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useServicesStore } from '@/hooks/useServicesStore';
import { Service, CreateServiceInput, UpdateServiceInput } from '@/types/services';
import { ServiceFormModal } from './ServiceFormModal';
import { toast } from 'sonner';

export const ServicesManagement: React.FC = () => {
  const {
    services: adminServices,
    loading: isLoadingAdmin,
    fetchAdminServices,
    createService,
    updateService,
    deleteService,
    toggleServiceActive,
  } = useServicesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminServices().catch((err) => {
      console.warn('No se pudieron cargar servicios administrativos (requiere migración remota):', err);
    });
  }, [fetchAdminServices]);

  const filteredServices: Service[] = adminServices.filter((service: Service) => {
    const matchesQuery =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (service.badgeText && service.badgeText.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterActive === 'all'
        ? true
        : filterActive === 'active'
        ? service.isActive
        : !service.isActive;

    return matchesQuery && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const handleSaveService = async (
    data: CreateServiceInput | UpdateServiceInput
  ) => {
    if (editingService) {
      await updateService(editingService.id, data as UpdateServiceInput);
      toast.success('Servicio actualizado exitosamente.');
    } else {
      await createService(data as CreateServiceInput);
      toast.success('Servicio creado exitosamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingServiceId) return;
    try {
      await deleteService(deletingServiceId);
      toast.success('Servicio eliminado exitosamente.');
      setDeletingServiceId(null);
    } catch (err: any) {
      toast.error('Error al eliminar servicio: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleToggle = async (service: Service) => {
    try {
      await toggleServiceActive(service.id, !service.isActive);
      toast.success(`Servicio ${!service.isActive ? 'activado' : 'desactivado'}.`);
    } catch (err: any) {
      toast.error('Error al actualizar estado: ' + (err.message || 'Error'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Wrench className="w-6 h-6" />
            </span>
            Gestión de Servicios Complementarios
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Administra los servicios, precios, periodicidades y disponibilidad pública de ConVoltaje.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdminServices()}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-2 text-sm"
            title="Recargar servicios"
          >
            <RotateCcw className={`w-4 h-4 ${isLoadingAdmin ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, categoría o detalle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Estado:</span>
          <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterActive === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos ({adminServices.length})
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterActive === 'active'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Activos ({adminServices.filter((s: Service) => s.isActive).length})
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterActive === 'inactive'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inactivos ({adminServices.filter((s: Service) => !s.isActive).length})
            </button>
          </div>
        </div>
      </div>

      {/* Listado de Servicios */}
      {isLoadingAdmin && adminServices.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-sm">Cargando catálogo de servicios...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/20 border border-slate-800/60 rounded-2xl p-8">
          <Wrench className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No se encontraron servicios</h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery
              ? 'Prueba modificando los términos de búsqueda o el filtro de estado.'
              : 'Empieza agregando un servicio complementario para tus clientes.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterActive('all');
              }}
              className="mt-4 text-xs text-cyan-400 hover:text-cyan-300 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                service.isActive
                  ? 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40 shadow-lg shadow-black/20'
                  : 'bg-slate-950/40 border-slate-800/50 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center text-xs font-bold">
                      #{service.sortOrder}
                    </span>
                    {service.badgeText && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {service.badgeText}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleToggle(service)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      service.isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {service.isActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Inactivo
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>

                <p className="text-sm text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-baseline justify-between">
                  <div className="flex items-center text-cyan-400 font-bold text-xl">
                    <DollarSign className="w-5 h-5 -mr-1" />
                    <span>{service.price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-slate-400 font-normal ml-1">USD</span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{service.billingPeriod}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEditModal(service)}
                  className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors"
                  title="Editar servicio"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingServiceId(service.id)}
                  className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                  title="Eliminar servicio"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        editingService={editingService}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingServiceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <span className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-white">¿Eliminar este servicio?</h3>
                <p className="text-xs text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              El servicio dejará de ser visible en el catálogo público y se removerá permanentemente de la base de datos.
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeletingServiceId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-colors shadow-lg shadow-rose-600/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
