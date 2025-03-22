import express from "express";
import puppeteer from "puppeteer";

const router = express.Router();

// Function to determine the store based on the URL
function getStore(url) {
  if (url.includes("mercadolivre.com")) return "mercadolivre";
  if (url.includes("amazon")) return "amazon";
  return null;
}

// Scraper function
async function fetchProductData(url) {
  const store = getStore(url);
  if (!store) throw new Error("Unsupported store");

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });

    let
      title = 'Título indisponível',
      priceSymbol = 'R$',
      priceFirst = '00',
      priceFraction = '00',
      priceFinal = '',
      imageUrl;

    if (store === "mercadolivre") {
      title = await page.$eval("h1.ui-pdp-title", el => el.innerText.trim());
      priceSymbol = await page.$eval(".andes-money-amount__currency-symbol", el => el.innerText.trim());
      priceFirst = await page.$eval(".andes-money-amount__fraction", el => el.innerText.trim());
      priceFraction = await page.$eval(".andes-money-amount__cents", el => el.innerText.trim());
      imageUrl = await page.$eval(".ui-pdp-gallery__figure img", el => el.src);
    } else if (store === "amazon") {
      title = await page.$eval("#productTitle", el => el.innerText.trim());
      priceSymbol = await page.$eval(".a-price-symbol", el => el.innerText.trim());
      priceFirst = await page.$eval(".a-price-whole", el => el.innerText.trim());
      priceFraction = await page.$eval(".a-price-fraction", el => el.innerText.trim());
      imageUrl = await page.$eval("#landingImage", el => el.src);
    } 

    priceFinal =  priceSymbol + ' ' + priceFirst.replace('\n,', '') + `,${priceFraction}`

    await browser.close();
    return { title, priceFinal, imageUrl };
  } catch (error) {
    await browser.close();
    console.error(`Error fetching data from ${store}:`, error.message);
    return null;
  }
}

router.get('/scrape-data', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL parameter" });
  }

  try {
    const data = await fetchProductData(url);
    if (!data) {
      return res.status(500).json({ error: "Failed to fetch product data" });
    }
    res.json({title: data.title, price: data.priceFinal, imageUrl: data.imageUrl});
    console.log({title: data.title, price: data.priceFinal, imageUrl: data.imageUrl})
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;