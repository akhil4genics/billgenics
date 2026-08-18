import {
  Car,
  Clapperboard,
  HeartPulse,
  Laptop,
  Receipt,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tags,
  Utensils,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export type CategoryMeta = { label: string; color: string; icon: LucideIcon };

/* Single source of truth for category label + colour + icon, shared across
 * the donut chart, legend, upcoming list and recent-bills rows so colours stay
 * consistent everywhere on the dashboard. */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  grocery: { label: 'Grocery', color: '#10B981', icon: ShoppingCart },
  electronics: { label: 'Electronics', color: '#3B4EF8', icon: Laptop },
  telephone: { label: 'Telephone', color: '#8B5CF6', icon: Smartphone },
  dining: { label: 'Dining', color: '#F59E0B', icon: Utensils },
  transport: { label: 'Transport', color: '#0EA5E9', icon: Car },
  health: { label: 'Health', color: '#EF4444', icon: HeartPulse },
  utilities: { label: 'Utilities', color: '#06B6D4', icon: Zap },
  entertainment: { label: 'Entertainment', color: '#EC4899', icon: Clapperboard },
  clothing: { label: 'Clothing', color: '#14B8A6', icon: Shirt },
  other: { label: 'Other', color: '#6C63FF', icon: Receipt },
};

const FALLBACK: CategoryMeta = { label: 'Other', color: '#94A3B8', icon: Tags };

export function categoryMeta(category?: string): CategoryMeta {
  if (!category) return FALLBACK;
  return CATEGORY_META[category] ?? { ...FALLBACK, label: category };
}
