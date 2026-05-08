// =============================================
// Jaddidha - Data Service
// HOW TO ADD DATA:
// 1. Add truck types in TRUCK_TYPES array
// 2. Add categories in CATEGORIES array
// 3. Add products in PRODUCTS array
//    - Match truckTypeId and categoryId
// =============================================

export interface TruckType {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  year: string;
  image: any;
  badge?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  image: string;
  description: string;
  color: string;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: string;
  originalPrice?: string;
  image: string;
  truckTypeIds: string[]; // Which truck types this fits
  categoryId: string;
  partNumber?: string;
  isOriginal: boolean;
  inStock: boolean;
  badge?: string;
}

// =============================================
// TRUCK TYPES
// =============================================
export const TRUCK_TYPES: TruckType[] = [
  {
    id: 'mb1',
    name: 'أكتروس MB1',
    nameEn: 'Actros MB1',
    description: 'الجيل الأول - 1996 إلى 2002',
    year: '1996–2002',
    image: require('@/assets/images/actros-mb1.jpg'),
    badge: 'كلاسيك',
  },
  {
    id: 'mb2',
    name: 'أكتروس MB2',
    nameEn: 'Actros MB2',
    description: 'الجيل الثاني - 2003 إلى 2008',
    year: '2003–2008',
    image: require('@/assets/images/actros-mb2.jpg'),
  },
  {
    id: 'mb3',
    name: 'أكتروس MB3',
    nameEn: 'Actros MB3',
    description: 'الجيل الثالث - 2008 إلى 2011',
    year: '2008–2011',
    image: require('@/assets/images/actros-mb3.jpg'),
    badge: 'الأكثر طلباً',
  },
  {
    id: 'mb4',
    name: 'أكتروس MB4',
    nameEn: 'Actros MB4',
    description: 'الجيل الرابع - 2011 إلى 2018',
    year: '2011–2018',
    image: require('@/assets/images/actros-mb4.jpg'),
  },
  {
    id: 'mb5',
    name: 'أكتروس MB5',
    nameEn: 'Actros MB5',
    description: 'الجيل الخامس - 2018 إلى الآن',
    year: '2018–الآن',
    image: require('@/assets/images/actros-mb5.jpg'),
    badge: 'أحدث إصدار',
  },
];

// =============================================
// CATEGORIES
// =============================================
export const CATEGORIES: Category[] = [
  {
    id: 'engine',
    name: 'المكينة',
    nameEn: 'Engine',
    icon: 'settings',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&q=80',
    description: 'قطع المحرك والمكينة الأصلية',
    color: '#E8820C',
  },
  {
    id: 'brakes',
    name: 'البريكات',
    nameEn: 'Brakes',
    icon: 'disc-full',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
    description: 'نظام الفرامل الكامل',
    color: '#D4AF37',
  },
  {
    id: 'filters',
    name: 'الفلاتر',
    nameEn: 'Filters',
    icon: 'filter-alt',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&q=80',
    description: 'فلاتر الزيت والهواء والوقود',
    color: '#22C55E',
  },
  {
    id: 'gearbox',
    name: 'الكير',
    nameEn: 'Gearbox',
    icon: 'settings-input-component',
    image: 'https://images.unsplash.com/photo-1596390940929-d3f2ede35bb7?w=400&q=80',
    description: 'قطع ناقل الحركة والكير',
    color: '#A78BFA',
  },
  {
    id: 'electrical',
    name: 'الكهربائيات',
    nameEn: 'Electrical',
    icon: 'electric-bolt',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400&q=80',
    description: 'جميع القطع الكهربائية والإلكترونية',
    color: '#3B82F6',
  },
];

// =============================================
// PRODUCTS
// =============================================
// To add a new product: copy one object below and update the fields
// truckTypeIds: which trucks this product fits (can be multiple)
// categoryId: which category it belongs to
// =============================================
export const PRODUCTS: Product[] = [
  // ENGINE PRODUCTS
  {
    id: 'eng-001',
    name: 'طلمبة زيت المكينة MB1',
    nameEn: 'Engine Oil Pump MB1',
    description: 'طلمبة زيت أصلية مرسيدس للمكينة OM 501',
    price: '185,000',
    originalPrice: '220,000',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80',
    truckTypeIds: ['mb1', 'mb2'],
    categoryId: 'engine',
    partNumber: 'A0001802101',
    isOriginal: true,
    inStock: true,
    badge: 'أصلي',
  },
  {
    id: 'eng-002',
    name: 'كاسكيت رأس المكينة MB3',
    nameEn: 'Head Gasket MB3',
    description: 'كاسكيت رأس مكينة OM 501 LA أصلي مرسيدس',
    price: '95,000',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80',
    truckTypeIds: ['mb3', 'mb4'],
    categoryId: 'engine',
    partNumber: 'A4420161220',
    isOriginal: true,
    inStock: true,
  },
  {
    id: 'eng-003',
    name: 'بيستم مكينة أكتروس MB5',
    nameEn: 'Engine Piston MB5',
    description: 'بيستمات أصلية للجيل الخامس OM 471',
    price: '250,000',
    image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&q=80',
    truckTypeIds: ['mb5'],
    categoryId: 'engine',
    partNumber: 'A4710300017',
    isOriginal: true,
    inStock: false,
    badge: 'طلب مسبق',
  },

  // BRAKES PRODUCTS
  {
    id: 'brk-001',
    name: 'طقم بريك أمامي MB2',
    nameEn: 'Front Brake Kit MB2',
    description: 'طقم بريك أمامي كامل أصلي مرسيدس',
    price: '145,000',
    originalPrice: '170,000',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    truckTypeIds: ['mb2', 'mb3'],
    categoryId: 'brakes',
    partNumber: 'A0044210410',
    isOriginal: true,
    inStock: true,
    badge: 'عرض',
  },
  {
    id: 'brk-002',
    name: 'دسك بريك خلفي MB4',
    nameEn: 'Rear Brake Disc MB4',
    description: 'دسك بريك خلفي عالي الجودة للجيل الرابع',
    price: '78,000',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    truckTypeIds: ['mb4', 'mb5'],
    categoryId: 'brakes',
    partNumber: 'A9704210012',
    isOriginal: true,
    inStock: true,
  },
  {
    id: 'brk-003',
    name: 'كاليبر بريك MB3',
    nameEn: 'Brake Caliper MB3',
    description: 'كاليبر فرامل أصلي مرسيدس MB3',
    price: '195,000',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    truckTypeIds: ['mb3'],
    categoryId: 'brakes',
    partNumber: 'A0044302001',
    isOriginal: true,
    inStock: true,
  },

  // FILTERS PRODUCTS
  {
    id: 'flt-001',
    name: 'فلتر هواء أكتروس MB1-MB5',
    nameEn: 'Air Filter All Models',
    description: 'فلتر هواء أصلي يناسب جميع موديلات أكتروس',
    price: '25,000',
    originalPrice: '32,000',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    truckTypeIds: ['mb1', 'mb2', 'mb3', 'mb4', 'mb5'],
    categoryId: 'filters',
    partNumber: 'A0000901751',
    isOriginal: true,
    inStock: true,
    badge: 'الأكثر طلباً',
  },
  {
    id: 'flt-002',
    name: 'فلتر وقود MB3/MB4',
    nameEn: 'Fuel Filter MB3/MB4',
    description: 'فلتر وقود أصلي عالي الأداء',
    price: '18,000',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    truckTypeIds: ['mb3', 'mb4'],
    categoryId: 'filters',
    partNumber: 'A4410900051',
    isOriginal: true,
    inStock: true,
  },
  {
    id: 'flt-003',
    name: 'فلتر زيت MB5',
    nameEn: 'Oil Filter MB5',
    description: 'فلتر زيت أصلي مرسيدس للجيل الخامس',
    price: '22,000',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80',
    truckTypeIds: ['mb5'],
    categoryId: 'filters',
    partNumber: 'A4721840425',
    isOriginal: true,
    inStock: true,
  },

  // GEARBOX PRODUCTS
  {
    id: 'gbx-001',
    name: 'كلتش كير MB2/MB3',
    nameEn: 'Gearbox Clutch MB2/MB3',
    description: 'كلتش كير Telligent أصلي مرسيدس',
    price: '320,000',
    image: 'https://images.unsplash.com/photo-1596390940929-d3f2ede35bb7?w=600&q=80',
    truckTypeIds: ['mb2', 'mb3'],
    categoryId: 'gearbox',
    partNumber: 'A0002503916',
    isOriginal: true,
    inStock: true,
  },
  {
    id: 'gbx-002',
    name: 'طلمبة كير MB4/MB5',
    nameEn: 'Gearbox Pump MB4/MB5',
    description: 'طلمبة ناقل الحركة للجيل الرابع والخامس',
    price: '145,000',
    image: 'https://images.unsplash.com/photo-1596390940929-d3f2ede35bb7?w=600&q=80',
    truckTypeIds: ['mb4', 'mb5'],
    categoryId: 'gearbox',
    partNumber: 'A9672601101',
    isOriginal: true,
    inStock: false,
    badge: 'طلب مسبق',
  },

  // ELECTRICAL PRODUCTS
  {
    id: 'elc-001',
    name: 'سنسور درجة حرارة MB3',
    nameEn: 'Temperature Sensor MB3',
    description: 'سنسور حرارة المكينة الأصلي',
    price: '35,000',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
    truckTypeIds: ['mb3', 'mb4'],
    categoryId: 'electrical',
    partNumber: 'A0041532528',
    isOriginal: true,
    inStock: true,
  },
  {
    id: 'elc-002',
    name: 'ECU مكينة MB5',
    nameEn: 'Engine ECU MB5',
    description: 'وحدة تحكم المكينة الإلكترونية الأصلية',
    price: '850,000',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
    truckTypeIds: ['mb5'],
    categoryId: 'electrical',
    partNumber: 'A0004460940',
    isOriginal: true,
    inStock: true,
    badge: 'مستورد',
  },
  {
    id: 'elc-003',
    name: 'ألترنيتر MB1/MB2',
    nameEn: 'Alternator MB1/MB2',
    description: 'دينامو شحن أصلي مرسيدس 24V',
    price: '195,000',
    originalPrice: '230,000',
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&q=80',
    truckTypeIds: ['mb1', 'mb2'],
    categoryId: 'electrical',
    partNumber: 'A0061545302',
    isOriginal: true,
    inStock: true,
    badge: 'خصم',
  },
];

// =============================================
// HELPER FUNCTIONS
// =============================================
export function getProductsByTruckAndCategory(
  truckTypeId: string,
  categoryId: string
): Product[] {
  return PRODUCTS.filter(
    (p) =>
      p.truckTypeIds.includes(truckTypeId) && p.categoryId === categoryId
  );
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getTruckById(id: string): TruckType | undefined {
  return TRUCK_TYPES.find((t) => t.id === id);
}
