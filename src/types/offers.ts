/**
 * Types and interfaces for the ConVoltaje Offers Management Module
 */

export interface Offer {
  id: string;
  title: string;
  description?: string | null;
  originalPrice?: number | null;
  offerPrice: number;
  currency: 'USD';
  badgeText?: string | null;
  imagePath: string;
  imageUrl?: string;
  pdfPath?: string | null;
  pdfUrl?: string | null;
  isActive: boolean;
  startDate: string;
  endDate?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  // Campos administrativos opcionales (nunca expuestos a vistas anónimas)
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateOfferInput {
  title: string;
  description?: string;
  originalPrice?: number | null;
  offerPrice: number;
  currency?: 'USD';
  badgeText?: string;
  imagePath: string;
  pdfPath?: string | null;
  isActive?: boolean;
  startDate?: string;
  endDate?: string | null;
  sortOrder?: number;
}

export interface UpdateOfferInput {
  title?: string;
  description?: string | null;
  originalPrice?: number | null;
  offerPrice?: number;
  currency?: 'USD';
  badgeText?: string | null;
  imagePath?: string;
  pdfPath?: string | null;
  isActive?: boolean;
  startDate?: string;
  endDate?: string | null;
  sortOrder?: number;
}
