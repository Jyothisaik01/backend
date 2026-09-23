/**
 * Auto-Sync Service
 * Automatically ensures Customer Shopping Profiles, Darwin Memory,
 * and Product Occasion Tags are present on server startup (Local & Production MongoDB Atlas).
 */

const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const { generateProductConfidence } = require('./product-confidence.service');

const OCCASION_RULES = [
  {
    occasion: 'office',
    categories: ['Fashion', 'Footwear & Shoes', 'Bags & Luggage', 'Electronics', 'Stationery & Office', 'Laptops'],
    keywords: ['office', 'formal', 'shirt', 'trouser', 'blazer', 'laptop', 'oxford', 'derby', 'notebook', 'pen', 'desk', 'briefcase']
  },
  {
    occasion: 'wedding',
    categories: ['Fashion', 'Fashion & Apparel', 'Footwear & Shoes', 'Perfumes & Fragrances', 'Beauty & Personal Care'],
    keywords: ['wedding', 'ethnic', 'festive', 'kurta', 'saree', 'lehenga', 'sherwani', 'mojari', 'silk', 'embroid', 'gold', 'perfume', 'fragrance']
  },
  {
    occasion: 'travel',
    categories: ['Bags & Luggage', 'Footwear & Shoes', 'Audio', 'Electronics', 'Sports & Fitness'],
    keywords: ['travel', 'luggage', 'duffel', 'trolley', 'backpack', 'sneakers', 'power bank', 'noise', 'headphone', 'earbuds', 'sunglass', 'bottle']
  },
  {
    occasion: 'gym',
    categories: ['Sports & Fitness', 'Fitness', 'Footwear & Shoes', 'Sports & Equipment', 'Fashion'],
    keywords: ['gym', 'fitness', 'workout', 'running', 'yoga', 'training', 'jogger', 'dry fit', 'compression', 'shaker', 'dumbbell', 'mat', 'sweat']
  },
  {
    occasion: 'college',
    categories: ['Fashion', 'Footwear & Shoes', 'Bags & Luggage', 'Audio', 'Stationery & Office'],
    keywords: ['college', 'campus', 'hoodie', 'jeans', 'casual', 'tee', 't-shirt', 'backpack', 'canvas', 'sneakers', 'earbuds', 'notebook']
  },
  {
    occasion: 'party',
    categories: ['Fashion', 'Footwear & Shoes', 'Perfumes & Fragrances', 'Wearables', 'Beauty & Personal Care'],
    keywords: ['party', 'night', 'club', 'bomber', 'jacket', 'cocktail', 'dress', 'perfume', 'watch', 'black', 'leather', 'seduction', 'bold']
  }
];

async function ensureShoppingProfilesAndOccasions() {
  try {
    // 1. Sync Customers
    const uninitializedCusts = await Customer.find({
      isDeleted: { $ne: true },
      $or: [
        { shoppingProfile: { $exists: false } },
        { 'shoppingProfile.budget': { $exists: false } }
      ]
    }).limit(100);

    if (uninitializedCusts.length > 0) {
      for (const cust of uninitializedCusts) {
        cust.shoppingProfile = {
          budget: { min: 0, max: 10000, tier: 'any' },
          brands: ['Nike', 'Apple', 'Adidas', 'Puma'],
          sizes: { clothing: 'M', footwear: 'UK 8', bottoms: '32' },
          categories: ['Fashion', 'Footwear & Shoes', 'Electronics'],
          styles: ['Athletic / Gym', 'Casual Everyday', 'Formal / Office'],
          occasions: ['Office', 'Gym', 'College']
        };
        if (!cust.darwinMemory || !Array.isArray(cust.darwinMemory.memories) || cust.darwinMemory.memories.length === 0) {
          cust.darwinMemory = {
            enabled: true,
            memories: [
              { key: 'preferred_shoe_size', value: 'Footwear UK 8', confidence: 1.0, source: 'user_stated', updatedAt: new Date() },
              { key: 'budget_sweetspot', value: 'Prefers deals under ₹10,000', confidence: 0.92, source: 'orders', updatedAt: new Date() },
              { key: 'style_vibe', value: 'Active fitness & office professional', confidence: 0.88, source: 'browsing', updatedAt: new Date() }
            ],
            recentBrowsedCategories: ['Fashion', 'Footwear & Shoes', 'Electronics'],
            recentBrowsedProductIds: []
          };
        }
        await cust.save();
      }
      console.log(`[AutoSync] Initialized shopping profiles for ${uninitializedCusts.length} customers.`);
    }

    // 2. Sync Product Occasions & Confidence Insights
    const untaggedProducts = await Product.find({
      isDeleted: { $ne: true },
      $or: [
        { occasions: { $exists: false } },
        { occasions: { $size: 0 } },
        { confidenceInsights: { $exists: false } },
        { confidenceInsights: null }
      ]
    }).limit(200);

    if (untaggedProducts.length > 0) {
      for (const prod of untaggedProducts) {
        const nameLower = (prod.name || '').toLowerCase();
        const cat = prod.category || '';
        const descLower = (prod.description || '').toLowerCase();

        const matched = new Set(prod.occasions || []);
        for (const rule of OCCASION_RULES) {
          const catMatch = rule.categories.includes(cat);
          const kwMatch = rule.keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw));
          if (kwMatch || (catMatch && Math.random() < 0.35)) {
            matched.add(rule.occasion);
          }
        }
        prod.occasions = Array.from(matched);
        if (!prod.confidenceInsights) {
          try {
            prod.confidenceInsights = generateProductConfidence(prod, []);
          } catch (e) {}
        }
        await prod.save();
      }
      console.log(`[AutoSync] Synced occasions & confidence insights for ${untaggedProducts.length} products.`);
    }
  } catch (err) {
    console.warn('[AutoSync] Error during database sync:', err.message);
  }
}

module.exports = {
  ensureShoppingProfilesAndOccasions
};

