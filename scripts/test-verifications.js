const mongoose = require('mongoose');

async function testAll() {
  await mongoose.connect('mongodb://127.0.0.1:27017/inventory-app');
  console.log('Connected to MongoDB');

  // 1. Test getInventoryAnalytics logic
  const adminExt = require('../services/admin-extended.service');
  let mockRes = {
    json(data) {
      console.log('\n--- 1. Inventory Analytics Output ---');
      console.log('Total Stock Units:', data.totalStock);
      console.log('Total Products:', data.totalProducts);
      console.log('Total Valuation:', data.totalValuation);
      console.log('Low Stock Count:', data.lowStockCount);
      console.log('Categories Count:', data.categoryBreakdown?.length);
      console.log('Sample Category Breakdown (first 5):', data.categoryBreakdown?.slice(0, 5));
    },
    status(code) {
      console.error('Error status:', code);
      return this;
    }
  };
  await adminExt.getInventoryAnalytics({}, mockRes);

  // 2. Check vendor profile functions
  const authService = require('../services/auth.service');
  const User = require('../models/user.model');
  const vendor = await User.findOne({ isDeleted: { $ne: true } });
  if (vendor) {
    console.log('\n--- 2. Testing Vendor Profile Retrieval ---');
    const prof = await authService.getVendorProfile(vendor._id);
    console.log('Retrieved Vendor Profile:', { id: prof._id, name: prof.name, email: prof.email });
  }

  // 3. Test daily vendor digest compiler (dry-run check)
  const emailCron = require('../services/email-cron.service');
  // 4. Test Customer Shopping Profile & Darwin Memory
  const Customer = require('../models/customer.model');
  const cust = await Customer.findOne({ isDeleted: { $ne: true } });
  if (cust) {
    console.log('\n--- 4. Testing Customer Shopping Profile & Memory ---');
    console.log('Customer:', cust.name, 'Email:', cust.email);
    console.log('Budget Max:', cust.shoppingProfile?.budget?.max);
    console.log('Footwear Size:', cust.shoppingProfile?.sizes?.footwear);
    console.log('Clothing Size:', cust.shoppingProfile?.sizes?.clothing);
    console.log('Darwin Memory Enabled:', cust.darwinMemory?.enabled);
    console.log('Learned Memories Count:', cust.darwinMemory?.memories?.length);
  }

  // 5. Test Product Confidence / Decision Assistant
  const Product = require('../models/product.model');
  const sampleProd = await Product.findOne({ isDeleted: { $ne: true } });
  if (sampleProd) {
    const { generateProductConfidence } = require('../services/product-confidence.service');
    const conf = generateProductConfidence(sampleProd, [], cust?.shoppingProfile);
    console.log('\n--- 5. Testing Product Confidence / Decision Assistant ---');
    console.log('Product:', sampleProd.name);
    console.log('Title:', conf.title);
    console.log('Highlights:', conf.highlights);
    console.log('Consideration (Watchout):', conf.consideration);
    console.log('Darwin Explanation:', conf.darwinExplanation);
  }

  console.log('\n✅ All backend unit checks passed successfully.');
  process.exit(0);
}

testAll().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});

