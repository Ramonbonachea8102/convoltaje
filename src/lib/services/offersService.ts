import { supabase } from '../supabase';
import { Offer, CreateOfferInput, UpdateOfferInput } from '../../types/offers';
import { storageService } from './storageService';

/**
 * Mapea una fila cruda de la base de datos al tipo de dominio `Offer`
 */
function mapOfferRow(row: any): Offer {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    originalPrice: row.original_price != null ? Number(row.original_price) : null,
    offerPrice: Number(row.offer_price),
    currency: row.currency || 'USD',
    badgeText: row.badge_text,
    imagePath: row.image_path,
    imageUrl: storageService.getPublicUrl(row.image_path),
    pdfPath: row.pdf_path,
    pdfUrl: row.pdf_path ? storageService.getPublicUrl(row.pdf_path) : null,
    isActive: Boolean(row.is_active),
    startDate: row.start_date,
    endDate: row.end_date,
    sortOrder: Number(row.sort_order || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export const offersService = {
  /**
   * Obtiene la lista de ofertas activas y vigentes para el portal público.
   * Excluye deliberadamente columnas administrativas privadas (created_by, updated_by).
   */
  async listPublicActiveOffers(): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('public_offers')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error al consultar ofertas públicas de Supabase:', error);
      throw new Error(`Error al cargar ofertas: ${error.message}`);
    }

    return (data || []).map(mapOfferRow);
  },

  /**
   * Obtiene la lista completa de ofertas para administradores (activas, inactivas, expiradas).
   * Se ejecuta mediante RPC protegido que valida rol administrativo en PostgreSQL.
   */
  async listAdminOffers(): Promise<Offer[]> {
    const { data, error } = await supabase.rpc('admin_list_offers');

    if (error) {
      console.error('Error al consultar ofertas administrativas de Supabase:', error);
      throw new Error(`Error al cargar ofertas de administración: ${error.message}`);
    }

    return (data || []).map(mapOfferRow);
  },

  /**
   * Crea una nueva oferta en la base de datos a través de RPC administrativo protegido.
   * El backend de PostgreSQL asigna automáticamente created_by y updated_by desde auth.uid().
   */
  async createOffer(input: CreateOfferInput): Promise<Offer> {
    const payload = {
      title: input.title.trim(),
      description: input.description?.trim() || null,
      original_price: input.originalPrice != null ? input.originalPrice : null,
      offer_price: input.offerPrice,
      currency: input.currency || 'USD',
      badge_text: input.badgeText?.trim() || 'OFERTA ESPECIAL',
      image_path: input.imagePath,
      pdf_path: input.pdfPath || null,
      is_active: input.isActive ?? true,
      start_date: input.startDate || new Date().toISOString(),
      end_date: input.endDate || null,
      sort_order: input.sortOrder ?? 0,
    };

    const { data, error } = await supabase.rpc('admin_create_offer', {
      p_payload: payload,
    });

    if (error) {
      console.error('Error al insertar oferta en Supabase:', error);
      throw new Error(`Error al crear la oferta: ${error.message}`);
    }

    return mapOfferRow(data);
  },

  /**
   * Actualiza una oferta existente a través de RPC administrativo protegido.
   * El backend de PostgreSQL asigna automáticamente updated_by desde auth.uid().
   */
  async updateOffer(id: string, input: UpdateOfferInput): Promise<Offer> {
    const payload: Record<string, any> = {};

    if (input.title !== undefined) payload.title = input.title.trim();
    if (input.description !== undefined) payload.description = input.description?.trim() || null;
    if (input.originalPrice !== undefined) payload.original_price = input.originalPrice;
    if (input.offerPrice !== undefined) payload.offer_price = input.offerPrice;
    if (input.currency !== undefined) payload.currency = input.currency;
    if (input.badgeText !== undefined) payload.badge_text = input.badgeText?.trim() || null;
    if (input.imagePath !== undefined) payload.image_path = input.imagePath;
    if (input.pdfPath !== undefined) payload.pdf_path = input.pdfPath;
    if (input.isActive !== undefined) payload.is_active = input.isActive;
    if (input.startDate !== undefined) payload.start_date = input.startDate;
    if (input.endDate !== undefined) payload.end_date = input.endDate;
    if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

    const { data, error } = await supabase.rpc('admin_update_offer', {
      p_id: id,
      p_payload: payload,
    });

    if (error) {
      console.error(`Error al actualizar oferta ${id}:`, error);
      throw new Error(`Error al actualizar la oferta: ${error.message}`);
    }

    return mapOfferRow(data);
  },

  /**
   * Elimina una oferta por ID a través de RPC administrativo protegido
   */
  async deleteOffer(id: string): Promise<void> {
    const { error } = await supabase.rpc('admin_delete_offer', {
      p_id: id,
    });

    if (error) {
      console.error(`Error al eliminar oferta ${id}:`, error);
      throw new Error(`Error al eliminar la oferta: ${error.message}`);
    }
  },

  /**
   * Activa o desactiva rápidamente una oferta
   */
  async toggleOfferActive(id: string, currentActiveStatus: boolean): Promise<Offer> {
    return this.updateOffer(id, { isActive: !currentActiveStatus });
  }
};
