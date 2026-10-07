export type BillingPeriod = 'mes' | 'año';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  billingPeriod?: BillingPeriod | null;
  badgeText?: string | null;
  imagePath?: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export interface CreateServiceInput {
  title: string;
  description: string;
  price: number;
  billingPeriod?: BillingPeriod | null;
  badgeText?: string | null;
  imagePath?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateServiceInput {
  title?: string;
  description?: string;
  price?: number;
  billingPeriod?: BillingPeriod | null;
  badgeText?: string | null;
  imagePath?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}
