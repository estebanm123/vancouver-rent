const puppeteer = require('puppeteer');
const scraper = require('./Scraper');

(async () => {
    // let data = {
    //     location: '', 
    //     type: 'apartment',
    //     "price-min": '0',
    //     "price-max": '10000',
    //     "bdr-min": 'min',
    //     "bdr-max": 'max',
    //     "bth-min": 'min',
    //     "bth-max": 'max',
    // }

    console.log('launching trovit');
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    const link = setUpLink(data);
    await scraper.initialize(page, link);

})();

    