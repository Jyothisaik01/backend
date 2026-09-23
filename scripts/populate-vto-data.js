/**
 * populate-vto-data.js
 * 
 * Configures Virtual Try-On (Anywear VTO) and fixes garment images
 * for all catalog products across both local MongoDB and production MongoDB Atlas.
 * 
 * Usage:
 *   Local:      node scripts/populate-vto-data.js
 *   Production: MONGO_URI="mongodb+srv://..." node scripts/populate-vto-data.js
 */

const mongoose = require('mongoose');
const Product = require('../models/product.model');

// Pre-screened, high-resolution clean garment assets (studio isolated)
const VTO_ASSET_LIBRARY = {
  shoes: {
    running: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
    sneakers: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80',
    boots: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=800&auto=format&fit=crop&q=80',
    default: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80'
  },
  hoodie: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
  tshirt: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
  shirt: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80',
  blazer: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80',
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80',
  pants: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80',
  dress: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
  cap: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80'
};

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory-app';
  console.log('Connecting to MongoDB at:', uri.replace(/:([^:@]{4})[^:@]*@/, ':****@'));

  await mongoose.connect(uri);
  console.log('Connected to MongoDB successfully.');

  const products = await Product.find({ isDeleted: false });
  console.log(`Scanning ${products.length} products...`);

  let updatedCount = 0;

  for (const p of products) {
    const name = (p.name || '').toLowerCase();
    const cat = (p.category || '').toLowerCase();

    let isApparelOrFootwear = false;
    let garmentType = '';
    let cleanImage = '';

    // 1. SHOES / FOOTWEAR
    if (/shoe|sneaker|running|walking|clog|loafers|boot|cloudmonster/i.test(name) || /footwear|shoes/i.test(cat)) {
      isApparelOrFootwear = true;
      garmentType = 'shoes';
      if (/boot/i.test(name)) cleanImage = VTO_ASSET_LIBRARY.shoes.boots;
      else if (/cloudmonster|running|marathon/i.test(name)) cleanImage = VTO_ASSET_LIBRARY.shoes.running;
      else cleanImage = VTO_ASSET_LIBRARY.shoes.sneakers;

      // Fix mismatched image (like Cloudmonster having jeans photo)
      if (!p.image || p.image.includes('1576995853123') || !/shoe|sneaker|footwear/i.test(p.image)) {
        p.image = cleanImage;
        p.images = [cleanImage];
      }
    }
    // 2. HOODIE / SWEATSHIRT
    else if (/hoodie|sweatshirt|pullover/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'top';
      cleanImage = VTO_ASSET_LIBRARY.hoodie;
    }
    // 3. T-SHIRT / TEE
    else if (/t-shirt|tee|crewneck|round neck/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'top';
      cleanImage = VTO_ASSET_LIBRARY.tshirt;
    }
    // 4. SHIRT
    else if (/shirt|oxford|blouse/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'top';
      cleanImage = VTO_ASSET_LIBRARY.shirt;
    }
    // 5. JACKET / BLAZER / COAT
    else if (/jacket|bomber|blazer|coat|outerwear/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'outerwear';
      cleanImage = /blazer/i.test(name) ? VTO_ASSET_LIBRARY.blazer : VTO_ASSET_LIBRARY.jacket;
    }
    // 6. JEANS / DENIM
    else if (/jean|denim/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'bottom';
      cleanImage = VTO_ASSET_LIBRARY.jeans;
    }
    // 7. PANTS / TROUSERS / CHINOS / CARGOS
    else if (/pant|trouser|chino|cargo|jogger/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'bottom';
      cleanImage = VTO_ASSET_LIBRARY.pants;
    }
    // 8. DRESS / GOWN / SKIRT
    else if (/dress|gown|skirt|frock/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'dress';
      cleanImage = VTO_ASSET_LIBRARY.dress;
    }
    // 9. CAP / HAT
    else if (/cap|hat|beanie/i.test(name)) {
      isApparelOrFootwear = true;
      garmentType = 'accessory';
      cleanImage = VTO_ASSET_LIBRARY.cap;
    }
    // 10. BAGS / LUGGAGE
    else if (/backpack|duffel|tote|bag|luggage|briefcase|messenger/i.test(name) || /bag/i.test(cat)) {
      isApparelOrFootwear = true;
      garmentType = 'bag';
      cleanImage = p.image || (Array.isArray(p.images) && p.images[0]) || '';
    }
    // 11. WATCHES / WEARABLES / EYEWEAR
    else if (/glasses|sunglasses|eyewear|watch|ring/i.test(name) || /wearables/i.test(cat)) {
      isApparelOrFootwear = true;
      garmentType = 'accessory';
      cleanImage = p.image || (Array.isArray(p.images) && p.images[0]) || '';
    }
    // 12. General Fashion
    else if (cat === 'fashion' || cat === 'clothing' || cat === 'apparel') {
      isApparelOrFootwear = true;
      garmentType = 'top';
      cleanImage = VTO_ASSET_LIBRARY.tshirt;
    }

    if (isApparelOrFootwear) {
      p.virtualTryOn = {
        enabled: true,
        garmentType: garmentType,
        tryOnImage: cleanImage || p.image || (Array.isArray(p.images) && p.images[0]) || '',
        tryOnSupported: true,
        decartAssetId: `vto_${p._id}`
      };

      p.clothingType = p.clothingType || garmentType;
      p.avatarCompatible = true;
      p.markModified('virtualTryOn');
      await p.save();
      updatedCount++;
    }
  }

  console.log(`\n=== Finished! Successfully updated ${updatedCount} products with Virtual Try-On configuration. ===`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

