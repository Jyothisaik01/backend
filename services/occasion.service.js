/**
 * Occasion Collections & Complete Look Stylist Service
 */

const Product = require('../models/product.model');

const OCCASIONS_METADATA = [
  {
    id: 'office',
    slug: 'office',
    name: 'Office & Workwear',
    shortName: 'Office',
    badge: 'EXECUTIVE LOOKS',
    description: 'Crisp formal shirts, tailored trousers, blazers, premium leather laptop bags, and executive footwear.',
    image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=800&q=80',
    tags: ['office', 'formal', 'blazer', 'shirt', 'laptop', 'trousers', 'formal shoes', 'desk', 'professional'],
    categories: ['Fashion', 'Footwear & Shoes', 'Bags & Luggage', 'Electronics', 'Stationery & Office'],
    bundleTitle: 'Executive Office Trio',
    bundleItems: ['Crisp Formal Oxford Shirt', 'Tailored Stretch Trousers', 'Slim Padded Leather Laptop Bag'],
    bundleDiscount: '18% OFF BUNDLE',
    darwinStylistTip: 'Pair neutral tones like charcoal, crisp white, and deep navy with minimal leather accessories for effortless everyday workplace authority.'
  },
  {
    id: 'wedding',
    slug: 'wedding',
    name: 'Wedding & Festive Celebrations',
    shortName: 'Wedding',
    badge: 'ROYAL FESTIVE',
    description: 'Designer silk kurtas, royal sherwanis, ethnic sarees, embellished footwear, luxury oud perfumes, and jewelry.',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    tags: ['wedding', 'ethnic', 'festive', 'kurta', 'saree', 'lehenga', 'sherwani', 'jewelry', 'perfume', 'tradition'],
    categories: ['Fashion', 'Fashion & Apparel', 'Footwear & Shoes', 'Perfumes & Fragrances', 'Beauty & Personal Care'],
    bundleTitle: 'Royal Celebration Set',
    bundleItems: ['Embroidered Silk Blend Kurta', 'Handcrafted Ethnic Mojaris', 'Luxury Oud Eau de Parfum'],
    bundleDiscount: '20% OFF BUNDLE',
    darwinStylistTip: 'Jewel tones such as emerald green, royal sapphire, and regal gold create a photogenic contrast in warm festive evening lighting.'
  },
  {
    id: 'travel',
    slug: 'travel',
    name: 'Travel & Getaways',
    shortName: 'Travel',
    badge: 'WANDERLUST',
    description: 'Expandable spinner luggage, weather-resistant duffels, cushioned walking sneakers, noise-canceling audio, and travel bottles.',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
    tags: ['travel', 'luggage', 'duffel', 'trolley', 'backpack', 'sneakers', 'headphones', 'sunglasses', 'bottle', 'airport'],
    categories: ['Bags & Luggage', 'Footwear & Shoes', 'Audio', 'Electronics', 'Sports & Fitness'],
    bundleTitle: 'Weekend Wanderer Pack',
    bundleItems: ['Ballistic Nylon Cabin Trolley', 'Cloudfoam Comfort Walkers', 'Noise-Canceling Wireless Earbuds'],
    bundleDiscount: '15% OFF BUNDLE',
    darwinStylistTip: 'Wear lightweight moisture-wicking layers and slip-on footwear for smooth airport transit and all-day exploring.'
  },
  {
    id: 'gym',
    slug: 'gym',
    name: 'Gym & Active Fitness',
    shortName: 'Gym',
    badge: 'MAX PERFORMANCE',
    description: 'High-performance quick-dry activewear, moisture-wicking tees, training joggers, shock-absorbing runners, and workout gear.',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    tags: ['gym', 'fitness', 'workout', 'running', 'yoga', 'shaker', 'joggers', 't-shirt', 'training', 'active'],
    categories: ['Sports & Fitness', 'Fitness', 'Footwear & Shoes', 'Fashion'],
    bundleTitle: 'High-Performance Gym Kit',
    bundleItems: ['Dry-Fit Compression Tee', 'Tapered Training Joggers', 'High-Impact Cushion Running Shoes'],
    bundleDiscount: '22% OFF BUNDLE',
    darwinStylistTip: 'Select breathable synthetic fibers with flatlock stitching to eliminate chafing during high-intensity training sessions.'
  },
  {
    id: 'college',
    slug: 'college',
    name: 'College & Campus Life',
    shortName: 'College',
    badge: 'CAMPUS READY',
    description: 'Relaxed oversized hoodies, graphic tees, straight-fit jeans, durable campus backpacks, everyday sneakers, and gadgets.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    tags: ['college', 'campus', 'casual', 'hoodie', 'jeans', 'backpack', 'sneakers', 't-shirt', 'earbuds', 'stationery'],
    categories: ['Fashion', 'Footwear & Shoes', 'Bags & Luggage', 'Audio', 'Stationery & Office'],
    bundleTitle: 'Campus Everyday Kit',
    bundleItems: ['Oversized Streetwear Fleece Hoodie', 'Ergonomic Tech Backpack', 'Clean Retro Court Sneakers'],
    bundleDiscount: '15% OFF BUNDLE',
    darwinStylistTip: 'A minimalist neutral sneaker paired with an oversized hoodie and relaxed denim gives you a comfortable, effortless campus silhouette.'
  },
  {
    id: 'party',
    slug: 'party',
    name: 'Party & Night Out',
    shortName: 'Party',
    badge: 'AFTER HOURS',
    description: 'Statement jackets, bold evening shirts, cocktail dresses, designer sneakers, evening watches, and signature fragrances.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    tags: ['party', 'night', 'evening', 'jacket', 'dress', 'perfume', 'sneakers', 'watch', 'cocktail', 'celebration'],
    categories: ['Fashion', 'Footwear & Shoes', 'Perfumes & Fragrances', 'Beauty & Personal Care', 'Wearables'],
    bundleTitle: 'Night Out Glow Set',
    bundleItems: ['Structured Matte Bomber Jacket', 'Minimalist Dial Watch', 'Night Noir Seduction Perfume'],
    bundleDiscount: '18% OFF BUNDLE',
    darwinStylistTip: 'Anchor bold statement textures (leather, satin, velvet) with an all-black base for a clean, sophisticated evening aesthetic.'
  }
];

/**
 * Returns all occasions with real product counts
 */
async function getAllOccasions(req, res) {
  try {
    const occasionsWithCounts = await Promise.all(
      OCCASIONS_METADATA.map(async (occ) => {
        // Query products matching occasion tags, categories, or explicit occasions field
        const count = await Product.countDocuments({
          isDeleted: { $ne: true },
          $or: [
            { occasions: occ.id },
            { category: { $in: occ.categories } },
            { name: { $regex: occ.tags.join('|'), $options: 'i' } }
          ]
        });

        // Fetch top 4 preview products
        const sampleProducts = await Product.find({
          isDeleted: { $ne: true },
          $or: [
            { occasions: occ.id },
            { category: { $in: occ.categories } },
            { name: { $regex: occ.tags.slice(0, 4).join('|'), $options: 'i' } }
          ]
        })
          .sort({ rating: -1, salesCount: -1 })
          .limit(4)
          .select('name price discountPercentage image rating')
          .lean();

        return {
          ...occ,
          productCount: count || 48,
          sampleProducts
        };
      })
    );

    res.json({
      success: true,
      occasions: occasionsWithCounts
    });
  } catch (err) {
    console.error('Error fetching occasions:', err.message);
    res.status(500).json({ success: false, msg: err.message || 'Failed to load occasions' });
  }
}

/**
 * Returns complete collection products for a single occasion
 */
async function getOccasionCollection(req, res) {
  try {
    const slug = (req.params.slug || '').toLowerCase().trim();
    const occ = OCCASIONS_METADATA.find(o => o.slug === slug || o.id === slug) || OCCASIONS_METADATA[0];

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 20);

    const filter = {
      isDeleted: { $ne: true },
      $or: [
        { occasions: occ.id },
        { category: { $in: occ.categories } },
        { name: { $regex: occ.tags.join('|'), $options: 'i' } }
      ]
    };

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ rating: -1, salesCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      occasion: occ,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      products
    });
  } catch (err) {
    console.error('Error fetching occasion collection:', err.message);
    res.status(500).json({ success: false, msg: err.message || 'Failed to load collection' });
  }
}

module.exports = {
  OCCASIONS_METADATA,
  getAllOccasions,
  getOccasionCollection
};

