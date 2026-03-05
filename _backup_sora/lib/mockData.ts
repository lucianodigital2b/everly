export type IngredientRisk = 'good' | 'neutral' | 'caution' | 'high_risk';

export interface Ingredient {
  name: string;
  risk: IngredientRisk;
  explanation: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryId: string;
  image: string;
  score: number;
  barcode: string;
  ingredients: Ingredient[];
  aiSummary: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  productCount: number;
}

export const CATEGORIES: Category[] = [
  { id: 'snacks', name: 'Snacks', icon: '🍿', color: '#FEF3C7', productCount: 142 },
  { id: 'beverages', name: 'Beverages', icon: '🥤', color: '#DBEAFE', productCount: 98 },
  { id: 'dairy', name: 'Dairy', icon: '🥛', color: '#EDE9FE', productCount: 76 },
  { id: 'cereals', name: 'Cereals', icon: '🌾', color: '#D1FAE5', productCount: 54 },
  { id: 'condiments', name: 'Condiments', icon: '🫙', color: '#FCE7F3', productCount: 63 },
  { id: 'frozen', name: 'Frozen', icon: '🧊', color: '#CFFAFE', productCount: 87 },
  { id: 'supplements', name: 'Supplements', icon: '💊', color: '#F0FDF4', productCount: 45 },
  { id: 'bakery', name: 'Bakery', icon: '🍞', color: '#FFF7ED', productCount: 112 },
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Greek Yogurt Plain',
    brand: 'Chobani',
    category: 'Dairy',
    categoryId: 'dairy',
    image: 'https://via.placeholder.com/300x300/D1FAE5/10b981?text=Yogurt',
    score: 91,
    barcode: '012345678901',
    ingredients: [
      { name: 'Cultured Skim Milk', risk: 'good', explanation: 'High-quality protein source with probiotics beneficial for gut health.' },
      { name: 'Live Active Cultures', risk: 'good', explanation: 'Promotes healthy gut microbiome and digestion.' },
      { name: 'Pectin', risk: 'neutral', explanation: 'Natural thickener derived from fruit; generally safe.' },
    ],
    aiSummary: 'An excellent source of protein and probiotics. Minimal processing with clean ingredients. Ideal for gut health and daily nutrition. Suitable for most dietary preferences.',
  },
  {
    id: 'p2',
    name: 'Almond Milk Original',
    brand: 'Almond Breeze',
    category: 'Beverages',
    categoryId: 'beverages',
    image: 'https://via.placeholder.com/300x300/DBEAFE/3b82f6?text=Almond+Milk',
    score: 78,
    barcode: '012345678902',
    ingredients: [
      { name: 'Almondmilk (Filtered Water, Almonds)', risk: 'good', explanation: 'Plant-based milk low in calories and saturated fat.' },
      { name: 'Calcium Carbonate', risk: 'neutral', explanation: 'Added calcium fortification, commonly used supplement.' },
      { name: 'Sunflower Lecithin', risk: 'neutral', explanation: 'Natural emulsifier, generally well-tolerated.' },
      { name: 'Carrageenan', risk: 'caution', explanation: 'Derived from red seaweed; some studies suggest potential gut inflammation in sensitive individuals.' },
    ],
    aiSummary: 'A solid dairy-free alternative with good calcium content. The presence of carrageenan warrants attention for those with IBS or gut sensitivity. Otherwise a clean, low-calorie beverage.',
  },
  {
    id: 'p3',
    name: 'Pringles Original',
    brand: 'Pringles',
    category: 'Snacks',
    categoryId: 'snacks',
    image: 'https://via.placeholder.com/300x300/FEF3C7/f59e0b?text=Pringles',
    score: 28,
    barcode: '012345678903',
    ingredients: [
      { name: 'Dried Potatoes', risk: 'neutral', explanation: 'Base ingredient, though heavily processed form.' },
      { name: 'Vegetable Oil', risk: 'caution', explanation: 'High in omega-6 fatty acids, may promote inflammation with excessive consumption.' },
      { name: 'Maltodextrin', risk: 'caution', explanation: 'High glycemic index additive that may spike blood sugar rapidly.' },
      { name: 'MSG', risk: 'caution', explanation: 'Flavor enhancer; generally safe but some individuals report sensitivity.' },
      { name: 'Disodium Inosinate', risk: 'high_risk', explanation: 'Synthetic flavor enhancer often paired with MSG; may aggravate gout.' },
      { name: 'TBHQ', risk: 'high_risk', explanation: 'Petroleum-derived preservative linked to immune toxicity at high doses.' },
    ],
    aiSummary: 'Highly processed snack with multiple additives of concern. Contains petroleum-derived preservatives and synthetic flavor enhancers. Best consumed rarely or avoided entirely.',
  },
  {
    id: 'p4',
    name: 'Kind Bar Almond & Coconut',
    brand: 'Kind',
    category: 'Snacks',
    categoryId: 'snacks',
    image: 'https://via.placeholder.com/300x300/D1FAE5/10b981?text=Kind+Bar',
    score: 82,
    barcode: '012345678904',
    ingredients: [
      { name: 'Almonds', risk: 'good', explanation: 'Rich in healthy fats, magnesium, and vitamin E.' },
      { name: 'Coconut', risk: 'good', explanation: 'Contains medium-chain triglycerides (MCTs) beneficial for energy.' },
      { name: 'Honey', risk: 'neutral', explanation: 'Natural sweetener, higher glycemic than refined sugar substitutes.' },
      { name: 'Glucose Syrup', risk: 'caution', explanation: 'Refined sugar that rapidly raises blood glucose levels.' },
    ],
    aiSummary: 'A wholesome snack bar with recognizable, minimally processed ingredients. Good source of healthy fats and fiber. Contains some added sugar but within acceptable limits for an active lifestyle.',
  },
  {
    id: 'p5',
    name: 'Coca-Cola Classic',
    brand: 'Coca-Cola',
    category: 'Beverages',
    categoryId: 'beverages',
    image: 'https://via.placeholder.com/300x300/FEE2E2/ef4444?text=Coke',
    score: 12,
    barcode: '012345678905',
    ingredients: [
      { name: 'Carbonated Water', risk: 'good', explanation: 'Naturally sparkling water, no health concerns.' },
      { name: 'High Fructose Corn Syrup', risk: 'high_risk', explanation: 'Linked to obesity, type 2 diabetes, and metabolic syndrome with regular consumption.' },
      { name: 'Caramel Color', risk: 'caution', explanation: 'May contain 4-MEI, a potential carcinogen at high doses.' },
      { name: 'Phosphoric Acid', risk: 'high_risk', explanation: 'Can leach calcium from bones and damage tooth enamel with regular consumption.' },
      { name: 'Natural Flavors', risk: 'neutral', explanation: 'Broad category; specific ingredients not disclosed.' },
      { name: 'Caffeine', risk: 'caution', explanation: 'Mildly addictive stimulant; excessive intake may cause anxiety and sleep disruption.' },
    ],
    aiSummary: 'Very low nutritional value with high sugar content and several additives of concern. Regular consumption is strongly associated with metabolic disease. Recommend avoiding or limiting to special occasions.',
  },
  {
    id: 'p6',
    name: 'Oat Milk Barista',
    brand: 'Oatly',
    category: 'Beverages',
    categoryId: 'beverages',
    image: 'https://via.placeholder.com/300x300/D1FAE5/10b981?text=Oatly',
    score: 71,
    barcode: '012345678906',
    ingredients: [
      { name: 'Oat Base (Water, Oats)', risk: 'good', explanation: 'Whole grain oats provide beta-glucan fiber beneficial for cholesterol.' },
      { name: 'Rapeseed Oil', risk: 'neutral', explanation: 'Low in saturated fat, but highly processed form loses some benefits.' },
      { name: 'Dipotassium Phosphate', risk: 'neutral', explanation: 'Mineral salt used as stabilizer; safe in moderate amounts.' },
      { name: 'Acidity Regulator', risk: 'neutral', explanation: 'Maintains pH balance of the product.' },
    ],
    aiSummary: 'A popular plant-based milk with decent nutritional profile. Higher in carbohydrates than other plant milks. Good choice for those needing dairy-free options, especially for coffee drinks.',
  },
  {
    id: 'p7',
    name: 'Cheerios Original',
    brand: "General Mills",
    category: 'Cereals',
    categoryId: 'cereals',
    image: 'https://via.placeholder.com/300x300/FEF3C7/f59e0b?text=Cheerios',
    score: 65,
    barcode: '012345678907',
    ingredients: [
      { name: 'Whole Grain Oats', risk: 'good', explanation: 'Rich in beta-glucan fiber shown to reduce LDL cholesterol.' },
      { name: 'Modified Corn Starch', risk: 'neutral', explanation: 'Used as thickener; generally safe but highly processed.' },
      { name: 'Sugar', risk: 'caution', explanation: 'Added sugar contributes to daily limit; 1g per serving is moderate.' },
      { name: 'Tripotassium Phosphate', risk: 'caution', explanation: 'Acidity regulator; very high doses may affect kidney function in sensitive individuals.' },
    ],
    aiSummary: 'A classic whole-grain cereal with heart health claims supported by oat fiber content. Low in sugar compared to most cereals. Moderate overall — a reasonable breakfast choice.',
  },
  {
    id: 'p8',
    name: 'Siggi\'s Icelandic Yogurt',
    brand: "Siggi's",
    category: 'Dairy',
    categoryId: 'dairy',
    image: 'https://via.placeholder.com/300x300/D1FAE5/10b981?text=Siggis',
    score: 88,
    barcode: '012345678908',
    ingredients: [
      { name: 'Pasteurized Skim Milk', risk: 'good', explanation: 'High protein dairy base with minimal processing.' },
      { name: 'Live Active Cultures', risk: 'good', explanation: 'Multiple probiotic strains for gut health support.' },
      { name: 'Organic Agave Nectar', risk: 'neutral', explanation: 'Low glycemic sweetener, used in small amounts.' },
    ],
    aiSummary: 'Skyr-style Icelandic yogurt with exceptionally high protein content and minimal ingredients. Very low in sugar with powerful probiotic cultures. One of the cleanest dairy products on the market.',
  },
];

export const TRENDING_PRODUCTS = PRODUCTS.filter(p => ['p1', 'p4', 'p6', 'p8'].includes(p.id));
export const RECENTLY_VIEWED = PRODUCTS.filter(p => ['p2', 'p3', 'p7'].includes(p.id));

export function getScoreClassification(score: number): {
  label: string;
  color: string;
  bg: string;
} {
  if (score >= 85) return { label: 'Excellent', color: '#059669', bg: '#D1FAE5' };
  if (score >= 70) return { label: 'Good', color: '#10b981', bg: '#ECFDF5' };
  if (score >= 50) return { label: 'Moderate', color: '#f59e0b', bg: '#FEF3C7' };
  return { label: 'Avoid', color: '#ef4444', bg: '#FEE2E2' };
}

export const INGREDIENT_RISK_CONFIG: Record<IngredientRisk, { label: string; color: string; bg: string }> = {
  good: { label: 'Good', color: '#059669', bg: '#D1FAE5' },
  neutral: { label: 'Neutral', color: '#6b7280', bg: '#F3F4F6' },
  caution: { label: 'Caution', color: '#d97706', bg: '#FEF3C7' },
  high_risk: { label: 'High Risk', color: '#dc2626', bg: '#FEE2E2' },
};
