import { supabase } from '../supabase';
import { Service, CreateServiceInput, UpdateServiceInput } from '../../types/services';

/**
 * Mapea una fila cruda de la base de datos al tipo de dominio `Service`
 */
function mapServiceRow(row: any): Service {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    billingPeriod: row.billing_period || null,
    badgeText: row.badge_text || null,
    imagePath: row.image_path || null,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const servicesService = {
  /**
   * Obtiene la lista de servicios activos desde la vista pública segura (public_services).
   * No proyecta ni expone columnas de auditoría administrativa.
   */
  async listPublicActiveServices(): Promise<Service[]> {
    const { data, error } = await supabase
      .from('public_services')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error al consultar servicios públicos de Supabase:', error);
      throw new Error(`Error al cargar servicios: ${error.message}`);
    }

    return (data || []).map(mapServiceRow);
  },

  /**
   * Obtiene la lista completa de servicios para administradores.
   * Ejecutado mediante RPC protegido que valida autorización en PostgreSQL.
   */
  async listAdminServices(): Promise<Service[]> {
    const { data, error } = await supabase.rpc('admin_list_services');

    if (error) {
      console.error('Error al consultar servicios administrativos de Supabase:', error);
      throw new Error(`Error al cargar servicios de administración: ${error.message}`);
    }

    return (data || []).map(mapServiceRow);
  },

  /**
   * Crea un nuevo servicio a través del RPC administrativo protegido.
   */
  async createService(input: CreateServiceInput): Promise<Service> {
    const payload = {
      title: input.title.trim(),
      description: input.description.trim(),
      price: input.price,
      billing_period: input.billingPeriod || null,
      badge_text: input.badgeText?.trim() || null,
      image_path: input.imagePath || null,
      is_active: input.isActive ?? true,
      sort_order: input.sortOrder ?? 0,
    };

    const { data, error } = await supabase.rpc('admin_create_service', {
      p_payload: payload,
    });

    if (error) {
      console.error('Error al insertar servicio en Supabase:', error);
      throw new Error(`Error al crear el servicio: ${error.message}`);
    }

    return mapServiceRow(data);
  },

  /**
   * Actualiza un servicio existente a través del RPC administrativo protegido.
   */
  async updateService(id: string, input: UpdateServiceInput): Promise<Service> {
    const payload: Record<string, any> = {};

    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.description !== undefined) payload.description = input.description.trim();
    if (input.price !== undefined) payload.price = input.price;
    if (input.billingPeriod !== undefined) payload.billing_period = input.billingPeriod;
    if (input.badgeText !== undefined) payload.badge_text = input.badgeText?.trim() || null;
    if (input.imagePath !== undefined) payload.image_path = input.imagePath;
    if (input.isActive !== undefined) payload.is_active = input.isActive;
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await supabase.rpc('admin_update_service', {
      p_id: id,
      p_payload: payload,
    });

    if (error) {
      console.error(`Error al actualizar servicio ${id}:`, error);
      throw new Error(`Error al actualizar el servicio: ${error.message}`);
    }

    return mapServiceRow(data);
  },

  /**
   * Elimina un servicio a través del RPC administrativo protegido.
   */
  async deleteService(id: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_service', {
      p_id: id,
    });

    if (error) {
      console.error(`Error al eliminar servicio ${id}:`, error);
      throw new Error(`Error al eliminar el servicio: ${error.message}`);
    }
  },

  /**
   * Alterna el estado activo de un servicio.
   */
  async toggleServiceActive(id: string, currentActiveStatus: boolean): Promise<Service> {
    return this.updateService(id, { isActive: !currentActiveStatus });
  }
};
