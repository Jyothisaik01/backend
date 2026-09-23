const mongoose = require('mongoose');
const Product = require('../models/product.model');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/inventory-app');
  console.log('Connected to MongoDB');

  const prods = await Product.find({ isDeleted: false })
    .select('name category clothingType subType image images virtualTryOn')
    .limit(25);

  console.log(`Found ${prods.length} sample products:`);
  for (const p of prods) {
    console.log(`- [${p._id}] "${p.name}" | Cat: ${p.category} | Type: ${p.clothingType || 'none'} | Img: ${p.image?.slice(0, 50)} | VTO: ${JSON.stringify(p.virtualTryOn)}`);
  }

  const cloudmonster = await Product.findOne({ name: /cloudmonster/i });
  if (cloudmonster) {
    console.log('\n--- CLOUDMONSTER PRODUCT ---');
    console.log(JSON.stringify(cloudmonster, null, 2));
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

