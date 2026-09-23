/**
 * Database Migration & Sync Script
 * Seeds/Updates Customer Shopping Profiles, Darwin Shopping Memory,
 * and Product Occasion Tags across Local and Production MongoDB.
 *
 * Usage:
 *   Local: node scripts/migrate-customer-shopping-profile.js
 *   Prod:  MONGO_URI="mongodb+srv://..." node scripts/migrate-customer-shopping-profile.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Auto-load .env if available
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(envPath);
  }
} catch (e) {}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory-app';

const Customer = require('../models/customer.model');
const Product = require('../models/product.model');
const { generateProductConfidence } = require('../services/product-confidence.service');

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

async function runMigration() {
  console.log('Connecting to MongoDB at:', MONGO_URI.replace(/:([^:@]+)@/, ':****@'));
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully!');

  // 1. Update Customers with default Shopping Profile & Darwin Memory
  const customers = await Customer.find({ isDeleted: { $ne: true } });
  console.log(`Found ${customers.length} customer accounts to inspect.`);

  let customersUpdated = 0;
  for (const cust of customers) {
    let modified = false;

    if (!cust.shoppingProfile || !cust.shoppingProfile.budget) {
      cust.shoppingProfile = {
        budget: { min: 0, max: 10000, tier: 'any' },
        brands: ['Nike', 'Apple', 'Adidas', 'Puma'],
        sizes: { clothing: 'M', footwear: 'UK 8', bottoms: '32' },
        categories: ['Fashion', 'Footwear & Shoes', 'Electronics'],
        styles: ['Athletic / Gym', 'Casual Everyday', 'Formal / Office'],
        occasions: ['Office', 'Gym', 'College']
      };
      modified = true;
    }

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
      modified = true;
    }

    if (modified) {
      await cust.save();
      customersUpdated++;
    }
  }
  console.log(`Updated ${customersUpdated} customers with Shopping Profile & Darwin Memory.`);

  // 2. Tag Products with Occasions
  console.log('Tagging products with Occasions (Office, Wedding, Travel, Gym, College, Party)...');
  const products = await Product.find({ isDeleted: { $ne: true } });
  console.log(`Found ${products.length} products to tag.`);

  let productsTagged = 0;
  for (const prod of products) {
    const nameLower = (prod.name || '').toLowerCase();
    const cat = prod.category || '';
    const descLower = (prod.description || '').toLowerCase();

    const matchedOccasions = new Set(prod.occasions || []);

    for (const rule of OCCASION_RULES) {
      const catMatch = rule.categories.includes(cat);
      const kwMatch = rule.keywords.some(kw => nameLower.includes(kw) || descLower.includes(kw));

      if (kwMatch || (catMatch && Math.random() < 0.35)) {
        matchedOccasions.add(rule.occasion);
      }
    }

    const occasionsArray = Array.from(matchedOccasions);
    if (occasionsArray.length > (prod.occasions || []).length || !prod.confidenceInsights) {
      prod.occasions = occasionsArray;
      try {
        prod.confidenceInsights = generateProductConfidence(prod, []);
      } catch (e) {}
      await prod.save();
      productsTagged++;
    }
  }

  console.log(`Tagged and enriched ${productsTagged} products with occasion and confidence insights.`);

  // Summary counts
  for (const rule of OCCASION_RULES) {
    const count = await Product.countDocuments({ occasions: rule.occasion, isDeleted: { $ne: true } });
    console.log(`  - Occasion [${rule.occasion.toUpperCase()}]: ${count} products`);
  }

  console.log('Migration completed successfully!');
  await mongoose.disconnect();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});

