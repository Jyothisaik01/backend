const Product = require('../models/product.model');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getApiKey } = require('../config/gemini.config');

/**
 * AI-Powered Visual Product Search Service
 * Uses Google Gemini Vision AI (gemini-3.5-flash-lite / gemini-3.6-flash) to analyze uploaded photos,
 * extracting text concepts, item nature, and dominant color palette.
 * Matches products using a dual-pillar formula: 60-70% Concept & Theme + 30-40% Color Palette.
 */

// Analyze image with Google Gemini Vision AI
async function analyzeImageWithAI(imageDataUrl, rawTag = '') {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];
  const genAI = new GoogleGenerativeAI(apiKey);

  const parts = [];

  // Extract base64 inlineData if Data URL
  if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:')) {
    const match = imageDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2]
        }
      });
    }
  }

  const promptText = `You are an expert e-commerce visual search AI for an online marketplace.
Analyze this user-uploaded product or image carefully.
Contextual filename or tag provided: "${rawTag || ''}".

Determine:
1. What exact physical product, motif, character, or graphic is shown? (e.g. "Panda Mascot Graphic / Print", "White Leather Sneaker", "Denim Jacket", "Smartwatch")
2. Is it a physical apparel/footwear product, or a graphic/character/mascot/logo?
3. What is the primary concept / subject? (e.g. "panda", "sneaker", "jacket", "headphones")
4. What are the dominant colors? (e.g. ["black", "white"], ["navy", "white"], ["red"])
5. Dominant color description: (e.g. "Monochrome Black & White", "Classic Navy & White", "Bold Crimson Red")
6. Suggested catalog categories in our store: choose from ['Fashion', 'Fashion & Apparel', 'Footwear & Shoes', 'Bags & Luggage', 'Wearables', 'Audio', 'Electronics', 'Stationery & Office', 'Sports & Fitness']
7. Concept keywords (4-6 tokens describing the motif, type, or style): (e.g. ["panda", "cartoon", "animal", "graphic", "mascot", "print"])
8. Color keywords (2-4 tokens for matching color palette): (e.g. ["black", "white", "monochrome", "charcoal"])
9. 5 filter tags starting with "All" (e.g. ["All", "Panda", "Shoes", "Graphic", "Black & White"])

Return ONLY a valid JSON object without any markdown code formatting:
{
  "detectedItem": "Panda Mascot Graphic / Print",
  "itemType": "graphic_or_character",
  "primaryConcept": "panda",
  "dominantColors": ["black", "white"],
  "colorDescription": "Monochrome Black & White",
  "category": "Fashion",
  "suggestedCategories": ["Fashion", "Fashion & Apparel", "Footwear & Shoes", "Bags & Luggage", "Stationery & Office"],
  "conceptKeywords": ["panda", "cartoon", "animal", "graphic", "mascot", "print"],
  "colorKeywords": ["black", "white", "monochrome", "charcoal"],
  "keywords": ["panda", "graphic", "print", "cartoon", "black", "white"],
  "tags": ["All", "Panda", "Shoes", "Graphic", "Black & White"]
}`;

  parts.push(promptText);

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(parts);
      const text = result.response.text().trim();
      const cleanJson = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && (parsed.detectedItem || parsed.primaryConcept)) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[VisualSearch/AI] ${modelName} analysis warning:`, err.message?.slice(0, 120));
    }
  }

  return null;
}

// Fallback heuristic extraction from filename and cues
function extractHeuristicContext(rawTag = '') {
  const clean = String(rawTag || '').toLowerCase().replace(/[-_]/g, ' ');

  // Animal / Mascot / Cartoon heuristic
  if (/panda|cat|dog|bear|animal|mascot|cartoon|anime|character|foodpanda/.test(clean)) {
    const isPanda = /panda/.test(clean);
    return {
      detectedItem: isPanda ? 'Panda Mascot Graphic / Print' : 'Character & Mascot Graphic',
      itemType: 'graphic_or_character',
      primaryConcept: isPanda ? 'panda' : 'character',
      dominantColors: ['black', 'white'],
      colorDescription: 'Monochrome Black & White',
      category: 'Fashion',
      suggestedCategories: ['Fashion', 'Fashion & Apparel', 'Footwear & Shoes', 'Bags & Luggage', 'Stationery & Office'],
      conceptKeywords: isPanda
        ? ['panda', 'cartoon', 'animal', 'graphic', 'mascot', 'print']
        : ['character', 'cartoon', 'graphic', 'mascot', 'print'],
      colorKeywords: ['black', 'white', 'monochrome', 'charcoal'],
      keywords: isPanda
        ? ['panda', 'graphic', 'print', 'cartoon', 'black', 'white']
        : ['character', 'graphic', 'print', 'black', 'white'],
      tags: isPanda
        ? ['All', 'Panda', 'Shoes', 'Graphic', 'Black & White']
        : ['All', 'Graphic', 'Apparel', 'Black & White', 'Casual']
    };
  }

  if (/shoe|sneaker|clog|croc|boot|heel|footwear|loafer|sandal/.test(clean)) {
    const isWhite = clean.includes('white');
    return {
      detectedItem: isWhite ? 'White Casual Shoes / Sneakers' : 'Running & Casual Shoes',
      itemType: 'product',
      primaryConcept: 'shoe',
      dominantColors: isWhite ? ['white'] : ['black', 'white'],
      colorDescription: isWhite ? 'Classic All-White' : 'Monochrome Neutral',
      category: 'Footwear & Shoes',
      suggestedCategories: ['Footwear & Shoes', 'Fashion', 'Sports & Fitness'],
      conceptKeywords: ['shoe', 'sneaker', 'footwear', 'clog', 'casual'],
      colorKeywords: isWhite ? ['white', 'cloud'] : ['black', 'white'],
      keywords: ['shoe', 'sneaker', 'white', 'casual'],
      tags: ['All', 'Shoes', 'Sneakers', 'Men', 'Casual']
    };
  }

  if (/watch|smartwatch|band/.test(clean)) {
    return {
      detectedItem: 'Smartwatch & Wearable',
      itemType: 'product',
      primaryConcept: 'watch',
      dominantColors: ['black'],
      colorDescription: 'Obsidian Black',
      category: 'Wearables',
      suggestedCategories: ['Wearables', 'Electronics', 'Fashion'],
      conceptKeywords: ['watch', 'smartwatch', 'band', 'fitness'],
      colorKeywords: ['black', 'dark'],
      keywords: ['watch', 'smartwatch', 'band'],
      tags: ['All', 'Watches', 'Smart', 'Fitness', 'Wearables']
    };
  }

  if (/headphone|earphone|earbuds|audio|speaker/.test(clean)) {
    return {
      detectedItem: 'Wireless Audio Headphones',
      itemType: 'product',
      primaryConcept: 'headphone',
      dominantColors: ['black'],
      colorDescription: 'Matte Black',
      category: 'Audio',
      suggestedCategories: ['Audio', 'Electronics'],
      conceptKeywords: ['headphone', 'wireless', 'audio', 'earbuds'],
      colorKeywords: ['black', 'silver'],
      keywords: ['headphone', 'wireless', 'audio'],
      tags: ['All', 'Audio', 'Wireless', 'Noise Cancelling', 'Electronics']
    };
  }

  if (/bag|backpack|luggage|tote|purse/.test(clean)) {
    return {
      detectedItem: 'Travel Backpack / Bag',
      itemType: 'product',
      primaryConcept: 'bag',
      dominantColors: ['black', 'grey'],
      colorDescription: 'Charcoal & Black',
      category: 'Bags & Luggage',
      suggestedCategories: ['Bags & Luggage', 'Fashion'],
      conceptKeywords: ['bag', 'backpack', 'luggage', 'tote'],
      colorKeywords: ['black', 'grey', 'charcoal'],
      keywords: ['bag', 'backpack', 'travel'],
      tags: ['All', 'Bags', 'Travel', 'Backpacks', 'Daily']
    };
  }

  if (/shirt|tshirt|tee|hoodie|pant|jean|dress|jacket|coat|apparel/.test(clean)) {
    return {
      detectedItem: 'Fashion Apparel Wear',
      itemType: 'apparel',
      primaryConcept: 'shirt',
      dominantColors: ['black', 'white'],
      colorDescription: 'Neutral Monochrome',
      category: 'Fashion & Apparel',
      suggestedCategories: ['Fashion & Apparel', 'Fashion'],
      conceptKeywords: ['shirt', 'apparel', 'casual', 'jacket', 'tee', 'hoodie'],
      colorKeywords: ['black', 'white', 'grey'],
      keywords: ['shirt', 'apparel', 'casual', 'fashion'],
      tags: ['All', 'Apparel', 'Casual', 'Fashion', 'Men']
    };
  }

  // Default neutral lifestyle detection
  return {
    detectedItem: 'Fashion & Lifestyle Item',
    itemType: 'product',
    primaryConcept: 'fashion',
    dominantColors: ['black', 'white'],
    colorDescription: 'Monochrome Palette',
    category: 'Fashion',
    suggestedCategories: ['Fashion', 'Fashion & Apparel', 'Footwear & Shoes'],
    conceptKeywords: ['fashion', 'casual', 'style', 'streetwear', 'apparel'],
    colorKeywords: ['black', 'white', 'monochrome'],
    keywords: ['fashion', 'casual', 'streetwear'],
    tags: ['All', 'Fashion', 'Apparel', 'Casual', 'Trending']
  };
}

exports.searchByImage = async (req, res) => {
  try {
    const { image, detectedTag, category = 'all', aiContext: cachedAiContext } = req.body;

    // 1. Obtain AI context: use cached if provided (e.g. from filter clicks), otherwise run Vision AI
    let aiContext = cachedAiContext;

    if (!aiContext || !aiContext.detectedItem) {
      if (image) {
        aiContext = await analyzeImageWithAI(image, detectedTag);
      }
      if (!aiContext || !aiContext.detectedItem) {
        aiContext = extractHeuristicContext(detectedTag);
      }
    }

    const detectedTitle = aiContext.detectedItem || 'Similar Products';
    const primaryConcept = String(aiContext.primaryConcept || '').trim().toLowerCase();
    const dominantColors = Array.isArray(aiContext.dominantColors) ? aiContext.dominantColors : ['black', 'white'];
    const colorDescription = aiContext.colorDescription || 'Monochrome Palette';

    const conceptKeywords = (Array.isArray(aiContext.conceptKeywords) && aiContext.conceptKeywords.length > 0)
      ? aiContext.conceptKeywords
      : (aiContext.keywords || ['fashion', 'casual']);

    const colorKeywords = (Array.isArray(aiContext.colorKeywords) && aiContext.colorKeywords.length > 0)
      ? aiContext.colorKeywords
      : dominantColors;

    const suggestedCats = (Array.isArray(aiContext.suggestedCategories) ? aiContext.suggestedCategories : [aiContext.category || 'Fashion'])
      .map(c => String(c).toLowerCase());

    // 2. Build MongoDB query using word boundaries so "expandable" does not match "panda"
    const searchTokens = [...new Set([...conceptKeywords, ...colorKeywords])].filter(k => k && k.length > 1);
    const regexTokens = searchTokens.map(k => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'));

    const query = {
      isDeleted: { $ne: true }
    };

    // If a specific filter tag was selected by user
    if (category && category !== 'all' && category !== 'All') {
      const catRegex = new RegExp(`\\b${category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      query.$or = [
        { category: catRegex },
        { tags: catRegex },
        { name: catRegex }
      ];
    } else {
      // General visual search query across name, tags, and description
      query.$or = [
        { name: { $in: regexTokens } },
        { tags: { $in: regexTokens } },
        { description: { $in: regexTokens } }
      ];
    }

    let items = await Product.find(query)
      .select('name category description tags price originalPrice discountPercentage rating ratingCount image images color colors')
      .limit(100)
      .lean();

    // Fallback if zero items matched the strict regex
    if (items.length === 0) {
      items = await Product.find({
        isDeleted: { $ne: true },
        $or: [
          { category: { $in: suggestedCats.map(c => new RegExp(c, 'i')) } },
          { tags: { $in: searchTokens.map(t => new RegExp(t, 'i')) } }
        ]
      })
        .select('name category description tags price originalPrice discountPercentage rating ratingCount image images color colors')
        .limit(40)
        .lean();
    }

    // 3. Dual-Pillar Scoring Formula: 60-70% Concept & Theme + 30-40% Color Palette
    const scoredItems = [];
    const seenNames = new Set();

    for (const p of items) {
      // Normalize base name to deduplicate variants (e.g. "(Batch 2)", "(Edition 3)")
      const cleanName = (p.name || '')
        .replace(/\(Batch \d+\)/g, '')
        .replace(/\(Edition \d+\)/g, '')
        .replace(/\(v\d+\)/g, '')
        .replace(/\(Series \d+\)/g, '')
        .trim();

      if (seenNames.has(cleanName)) continue;

      const text = `${p.name || ''} ${p.description || ''} ${(p.tags || []).join(' ')} ${p.color || ''}`.toLowerCase();
      const nameLower = (p.name || '').toLowerCase();
      const catLower = (p.category || '').toLowerCase();

      let conceptHits = 0;
      let colorHits = 0;

      // Word boundary test for primary concept (e.g. \bpanda\b)
      const isPrimaryConceptMatch = primaryConcept && (
        new RegExp(`\\b${primaryConcept}\\b`, 'i').test(nameLower) ||
        new RegExp(`\\b${primaryConcept}\\b`, 'i').test(text)
      );

      conceptKeywords.forEach(k => {
        const reg = new RegExp(`\\b${k.toLowerCase()}\\b`, 'i');
        if (reg.test(nameLower)) conceptHits += 2.5;
        else if (reg.test(text)) conceptHits += 1.0;
      });

      colorKeywords.forEach(c => {
        const reg = new RegExp(`\\b${c.toLowerCase()}\\b`, 'i');
        if (reg.test(nameLower)) colorHits += 2.0;
        else if (reg.test(text)) colorHits += 1.0;
      });

      // Filter out products with 0 concept and 0 color matches
      if (conceptHits === 0 && colorHits === 0 && !isPrimaryConceptMatch) continue;

      let conceptScore = Math.min(100, (conceptHits / 3.0) * 100);
      if (isPrimaryConceptMatch) conceptScore = Math.max(conceptScore, 95);

      let colorScore = Math.min(100, (colorHits / 2.0) * 100);

      // Weighting: 65% Concept + 35% Color
      let rawScore = (conceptScore * 0.65) + (colorScore * 0.35);

      // Check if item is in suggested categories
      const isPreferredCat = suggestedCats.some(sc => catLower.includes(sc) || sc.includes(catLower));

      let matchLabel = 'Color Palette';

      if (isPrimaryConceptMatch) {
        // Direct subject match (e.g. Nike Dunk Panda) -> 92% - 96%
        rawScore = 92 + Math.min(4, colorHits * 2);
        matchLabel = primaryConcept ? `Direct ${primaryConcept.charAt(0).toUpperCase() + primaryConcept.slice(1)} Match` : 'Direct Match';
      } else if (conceptHits > 0 && colorHits > 0) {
        // Both concept & color matched -> 70% - 85%
        rawScore = isPreferredCat ? Math.min(85, Math.max(70, rawScore + 6)) : Math.min(76, Math.max(65, rawScore));
        matchLabel = 'Concept & Color';
      } else if (conceptHits > 0 && colorHits === 0) {
        // Concept/motif matched without explicit color -> 62% - 75%
        rawScore = isPreferredCat ? Math.min(76, Math.max(64, rawScore + 4)) : Math.min(68, Math.max(60, rawScore));
        matchLabel = 'Theme Match';
      } else if (conceptHits === 0 && colorHits > 0) {
        // Color-only matched (matching black & white palette) -> 60% - 70%
        rawScore = isPreferredCat ? (64 + Math.min(6, colorHits * 2)) : (60 + Math.min(5, colorHits * 1.5));
        matchLabel = 'Color Palette';
      }

      const finalScore = Math.round(rawScore);
      seenNames.add(cleanName);

      scoredItems.push({
        _id: p._id,
        name: cleanName,
        category: p.category,
        price: p.price,
        originalPrice: p.originalPrice || Math.round(p.price * 1.25),
        discountPercentage: p.discountPercentage || 20,
        rating: p.rating || 4.5,
        ratingCount: p.ratingCount || 420,
        image: p.image || (p.images && p.images[0]) || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
        similarity: `${finalScore}% Match`,
        _score: finalScore,
        matchLabel,
        isPreferredCat
      });
    }

    // Sort by calculated similarity descending; preferred categories break ties
    scoredItems.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      if (b.isPreferredCat && !a.isPreferredCat) return 1;
      if (!b.isPreferredCat && a.isPreferredCat) return -1;
      return 0;
    });

    res.json({
      success: true,
      detectedItem: detectedTitle,
      dominantColors: dominantColors,
      colorDescription: colorDescription,
      itemType: aiContext.itemType || 'product',
      tags: aiContext.tags || ['All', 'Shoes', 'Apparel', 'Trending'],
      aiContext: aiContext,
      products: scoredItems.slice(0, 16),
      total: scoredItems.length
    });
  } catch (err) {
    console.error('[VisualSearch] searchByImage error:', err);
    res.status(500).json({ msg: err.message || 'Visual search failed' });
  }
};
