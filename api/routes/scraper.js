import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// Common image-containing class names in e-commerce sites
const IMAGE_CLASSES = [
  'product-image',
  'main-image',
  'gallery-image',
  'product-photo',
  'item-image',
  'figure',
  'picture',
  'product-media',
  'showcase-image',
  'primary-image',
  'product-featured-image',
  'product-gallery',
  'product-main-image'
];


const shopsHTMLPathParams = {
    'amazon': {
        'image': 'https://m.media-amazon.com/images/I/',
        'imagePattern': /images\/I\/([^._]+)/,
        'price': 'https://www.amazon.com.br/dp/',
        'title': 'https://www.amazon.com.br/dp/',
    },
    'mercadolivre': {
        'image': 'https://www.mercadolivre.com.br/v2/items/',
        'price': 'https://www.mercadolivre.com.br/v2/items/',
        'title': 'https://www.mercadolivre.com.br/v2/items/'
    },
    'shopee': {
        'image': 'https://www.shopee.com.br/product/',
        'price': 'https://www.shopee.com.br/product/',
        'title': 'https://www.shopee.com.br/product/'
    }
}

router.get('/scrape-image', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);
    let imageUrl = null;

    // Determine which shop we're dealing with
    const shop = Object.keys(shopsHTMLPathParams).find(shop => url.includes(shop));
    
    if (shop) {
      const shopConfig = shopsHTMLPathParams[shop];
      
      if (shop === 'amazon') {
        $('img').each((_, element) => {
          const src = $(element).attr('src');
          if (src && src.includes(shopConfig.image)) {
            const matches = src.match(shopConfig.imagePattern);
            if (matches && matches[1]) {
              imageUrl = `${shopConfig.image}${matches[1]}.jpg`;
              return false;
            }
          }
        });
      } else {
        // Handle other shops using their specific patterns
        $('img').each((_, element) => {
          const src = $(element).attr('src');
          if (src && src.includes(shopConfig.image)) {
            imageUrl = src;
            return false;
          }
        });
      }
    }

    if (imageUrl) {
      res.json({ imageUrl });
    } else {
      res.status(404).json({ error: 'No suitable image found' });
    }
  } catch (error) {
    console.error('Error scraping image:', error);
    res.status(500).json({ error: 'Failed to scrape image from URL' });
  }
});

router.get('/scrape-price', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Fetch the HTML content of the URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);    

    $('a').each((_, element) => {
        const link = $(element).attr('href') || $(element).attr('src');
        const searchParams = new URL(link).searchParams;
        let priceParam = Array.from(searchParams.entries()).find(([key, value]) => 
          key.toLowerCase().includes('price') || 
          key.toLowerCase().includes('preço') ||
          value.toLowerCase().includes('R$') ||
          value.toLowerCase().includes('r$') ||
          value.match(/^\d+([.,]\d{2})?$/)
        );
        console.log(priceParam);
    });

    if (priceParam) {
      const priceValue = priceParam[1];
      res.json({ price: priceValue });
    } else {
      res.status(404).json({ error: 'No price found in URL parameters' });
    }
  } catch (error) {
    console.error('Error scraping price:', error);
    res.status(500).json({ error: 'Failed to scrape price from URL' });
  }
});

router.get('/scrape-title', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
    if (pathSegments.length > 0) {
      // Get the first segment after the domain
      const title = pathSegments[0]
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return title;
    }
    return 'Produto sem título';
  } catch (err) {
    return 'URL inválida';
  }
});

export default router; 