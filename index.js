const puppeteer = require('puppeteer');
const xlsx = require("xlsx");

(async () => {

    //const URL = "https://www.plazavea.com.pe/automotriz/motos";
    //const URL = "https://www.plazavea.com.pe/dormitorio";
    const URL = "https://www.plazavea.com.pe/zapatos";
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    // vitrine__products__comingSoon
    
    await page.goto(URL, { waitUntil: "networkidle2" });
    await page.setViewport({width: 1080, height: 1024});

    let products = [];

    while (true) {

        const empty = await page.evaluate(() => {
            if (document.querySelector(".vitrine__products__comingSoon"))
                return true;
            else
                return false;
        });

        if (empty) break;

        const pageProducts = await page.evaluate(() => {
            const productCards = Array.from(document.querySelectorAll(".Showcase__content"));

            return productCards.map((product) => {
                const name = product.querySelector(".Showcase__name").textContent;
                const brand = product.querySelector(".Showcase__brand a").textContent;
                let unitPrice = product.querySelector(".Showcase__salePrice").textContent.trim();
                const imageURL = product.querySelector(".Showcase__photo img").src;

                unitPrice = unitPrice.split(" ")[1];

                return {
                    name,
                    brand,
                    unitPrice,
                    imageURL
                };
            });
        });

        products = [...products, ...pageProducts];

        const next = await page.evaluate(() => {
            const nextButton = document.querySelector(".pagination__item.page-control.next");

            if (nextButton && !nextButton.classList.contains("disabled")) {
                nextButton.click();
                return true;
            }
            else{
                return false;
            }

        });

        if (!next) break;

        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    console.log(products);
    console.log("Cantidad: " + products.length);

    await browser.close();

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(products);
    const path = "products.xlsx";
  
    xlsx.utils.book_append_sheet(wb, ws, "Products");
    xlsx.writeFile(wb, path);
})();