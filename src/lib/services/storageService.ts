import { supabase } from '../supabase';

export const OFFERS_BUCKET = 'offers-assets';

export const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
export const ALLOWED_PDF_MIMES = ['application/pdf'];
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export const storageService = {
  /**
   * Valida tipo MIME, extensión y tamaño de un archivo en el cliente
   */
  validateFile(file: File, isPdf = false): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'No se ha proporcionado ningún archivo.' };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `El archivo supera el tamaño máximo permitido de 15 MB (tamaño actual: ${(file.size / (1024 * 1024)).toFixed(1)} MB).`,
      };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    const mime = file.type.toLowerCase();

    if (isPdf) {
      const isPdfMime = ALLOWED_PDF_MIMES.includes(mime);
      const isPdfExt = extension === 'pdf';
      if (!isPdfMime && !isPdfExt) {
        return { valid: false, error: 'El archivo seleccionado no es un documento PDF válido.' };
      }
    } else {
      const isImgMime = ALLOWED_IMAGE_MIMES.includes(mime);
      const isImgExt = ['jpg', 'jpeg', 'png', 'webp'].includes(extension || '');
      if (!isImgMime && !isImgExt) {
        return {
          valid: false,
          error: 'Formato de imagen inválido. Solo se admiten archivos JPG, PNG y WEBP.',
        };
      }
    }

    return { valid: true };
  },

  /**
   * Sanitiza el nombre de archivo para evitar caracteres problemáticos
   */
  sanitizeFileName(fileName: string): string {
    return fileName
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '_')
      .replace(/_+/g, '_');
  },

  /**
   * Sube un asset al bucket `offers-assets` usando una ruta estructurada y segura:
   * offers/{offer_id}/{uuid}-{safe-filename}.ext
   */
  async uploadOfferAsset(
    file: File,
    offerId: string,
    isPdf = false
  ): Promise<{ path: string; publicUrl: string }> {
    const validation = this.validateFile(file, isPdf);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const safeName = this.sanitizeFileName(file.name);
    const subfolder = isPdf ? 'documents' : 'images';
    const filePath = `offers/${offerId}/${subfolder}/${uniqueId}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(OFFERS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error subiendo archivo a Storage:', error);
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    const publicUrl = this.getPublicUrl(data.path);
    return { path: data.path, publicUrl };
  },

  /**
   * Elimina un archivo existente del bucket `offers-assets`
   */
  async deleteAsset(path: string): Promise<void> {
    if (!path) return;
    const { error } = await supabase.storage.from(OFFERS_BUCKET).remove([path]);
    if (error) {
      console.warn(`No se pudo eliminar el archivo previo en Storage (${path}):`, error);
    }
  },

  /**
   * Resuelve la URL pública para una ruta en `offers-assets`
   */
  getPublicUrl(path: string): string {
    if (!path) return '';
    // Si ya es una URL absoluta (fallback o URL externa), retornarla directamente
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path;
    }
    const { data } = supabase.storage.from(OFFERS_BUCKET).getPublicUrl(path);
    return data?.publicUrl || '';
  }
};
