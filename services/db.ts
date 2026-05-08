// =============================================
// Jaddidha - OnSpace Cloud Database Service
// All data is fetched from Supabase backend
// =============================================
import { getSupabaseClient } from '@/template';
import { AppConfig } from '@/constants/config';

const supabase = getSupabaseClient();

// ============================
// TYPES
// ============================
export interface DbTruckType {
  id: string;
  name: string;
  name_en: string;
  description: string;
  year_range: string;
  image_url: string | null;
  badge: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface DbCategory {
  id: string;
  name: string;
  name_en: string;
  icon: string;
  image_url: string;
  description: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

export interface DbProduct {
  id: string;
  name: string;
  name_en: string;
  description: string;
  price: string;
  original_price: string | null;
  wholesale_price: string | null;
  min_wholesale_qty: number;
  sale_type: 'retail' | 'wholesale' | 'both';
  image_url: string;
  truck_type_ids: string[];
  category_id: string;
  part_number: string | null;
  is_original: boolean;
  in_stock: boolean;
  badge: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPartRequest {
  id?: string;
  truck_type_id?: string;
  truck_name?: string;
  category_id?: string;
  category_name?: string;
  part_number?: string;
  part_name?: string;
  notes?: string;
  image_url?: string;
  customer_phone?: string;
  status?: string;
  created_at?: string;
}

export interface AppSetting {
  key: string;
  value: string;
  label: string;
}

// ============================
// TRUCK TYPES
// ============================
export async function fetchTruckTypes(): Promise<DbTruckType[]> {
  const { data, error } = await supabase
    .from('truck_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function upsertTruckType(truck: Partial<DbTruckType> & { id: string }) {
  const { data, error } = await supabase
    .from('truck_types')
    .upsert(truck)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTruckType(id: string) {
  const { error } = await supabase.from('truck_types').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// ============================
// CATEGORIES
// ============================
export async function fetchCategories(): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data || [];
}

export async function upsertCategory(cat: Partial<DbCategory> & { id: string }) {
  const { data, error } = await supabase
    .from('categories')
    .upsert(cat)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ============================
// PRODUCTS
// ============================
export async function fetchProducts(truckTypeId?: string, categoryId?: string): Promise<DbProduct[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (categoryId) query = query.eq('category_id', categoryId);
  if (truckTypeId) query = query.contains('truck_type_ids', [truckTypeId]);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchAllProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertProduct(product: Partial<DbProduct>) {
  const payload = { ...product, updated_at: new Date().toISOString() };
  const { data, error } = await supabase
    .from('products')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
  if (error) throw error;
}

// ============================
// PART REQUESTS
// ============================
export async function insertPartRequest(req: DbPartRequest) {
  const { data, error } = await supabase
    .from('part_requests')
    .insert(req)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchPartRequests(): Promise<DbPartRequest[]> {
  const { data, error } = await supabase
    .from('part_requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function updatePartRequestStatus(id: string, status: string) {
  const { error } = await supabase.from('part_requests').update({ status }).eq('id', id);
  if (error) throw error;
}

// ============================
// APP SETTINGS
// ============================
export async function fetchSettings(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('app_settings').select('*');
  if (error) return {};
  const result: Record<string, string> = {};
  (data || []).forEach((s: AppSetting) => {
    result[s.key] = s.value;
  });
  return result;
}

export async function updateSetting(key: string, value: string) {
  const { error } = await supabase
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ============================
// WHATSAPP HELPERS
// ============================
export function buildWhatsAppUrl(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildProductMessage(
  productName: string,
  truckName: string,
  categoryName: string,
  partNumber?: string | null
): string {
  let msg = `مرحبا، أريد هذا المنتج:\n\n`;
  msg += `نوع الشاحنة: ${truckName}\n`;
  msg += `التصنيف: ${categoryName}\n`;
  msg += `اسم المنتج: ${productName}\n`;
  if (partNumber) msg += `رقم القطعة: ${partNumber}`;
  return msg;
}

export function buildCartMessage(
  items: CartItem[],
  truckName: string
): string {
  let msg = `مرحبا، أريد الطلب التالي لشاحنة ${truckName}:\n`;
  msg += `━━━━━━━━━━━━━━━━\n`;
  items.forEach((item, i) => {
    msg += `${i + 1}. ${item.productName}\n`;
    if (item.partNumber) msg += `   رقم القطعة: ${item.partNumber}\n`;
    const priceLabel = item.isWholesale ? `سعر الجملة: ${item.price} د.ع (كمية: ${item.quantity})` : `السعر: ${item.price} د.ع`;
    msg += `   ${priceLabel}\n`;
    if (i < items.length - 1) msg += `\n`;
  });
  msg += `━━━━━━━━━━━━━━━━\n`;
  msg += `إجمالي القطع: ${items.length}\n`;
  msg += `أرجو التواصل معي لإتمام الطلب`;
  return msg;
}

export interface CartItem {
  productId: string;
  productName: string;
  partNumber?: string | null;
  price: string;
  wholesalePrice?: string | null;
  minWholesaleQty?: number;
  isWholesale?: boolean;
  categoryName: string;
  quantity: number;
}
