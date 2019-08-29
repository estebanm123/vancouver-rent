const puppeteer = require('puppeteer');
const scraper = require('./Scraper');

module.exports = async (data) => {
    // let data = {
    //     location: 'vancouver', 
    //     type: 'apartment',
    //     "price-min": '1000',
    //     "price-max": '1200',
    //     "bdr-min": 'min',
    //     "bdr-max": 'max',
    //     "bth-min": 'min',
    //     "bth-max": 'max',
    //}
    const browser = await puppeteer.launch({'args' : [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]});
    const page = await browser.newPage();
    const link = `https://vancouver.craigslist.org/search/apa?query=${data.location}&availabilityMode=0&sale_date=all+dates`;
    await scraper.initialize(page, link);

    await setUpSearch(page, data);

    await scraper.linkNavigate(page, '[title="clear all search parameters"] ~ button'); // clicks search button

    let listings = [];  

    let morePages = true;
    i = 0; // scrapes the newest 2 pages in case there are too many results (about 120 listings)
    while (morePages && i < 1) {
        i++;
        let results = await browsePage(page);
        listings = [...listings, ...results.listings];
        if (results.morePages) {
            await scraper.linkNavigate(page, '.search-legend a[class="button next"]');
        } else { 
            morePages = false;
        }    
    }
    browser.close();
    console.log('craigs ' + listings.length);
    return Promise.resolve(listings);
};

async function setUpSearch(page, data) {
    return page.evaluate(data => {
        document.querySelector('input[name="min_price"]').value = data['price-min'];
        document.querySelector('input[name="max_price"]').value = data['price-max'];
        document.querySelector('select[name="min_bedrooms"]').value = data['bdr-min'];
        document.querySelector('select[name="max_bedrooms"]').value = data['bdr-max'];
        document.querySelector('select[name="min_bathrooms"]').value = data['bth-min'];
        document.querySelector('select[name="max_bathrooms"]').value = data['bth-max'];

        let housingOptions = document.querySelector('div[class="title linklike "]');
        housingOptions.click();
        let housingOptionsList = housingOptions.nextElementSibling;
        console.log(housingOptionsList.length);
        switch(data.type) {
            case 'apartment':
                housingOptionsList.querySelector('li:nth-of-type(1) label').click();
                housingOptionsList.querySelector('li:nth-of-type(2) label').click();
                housingOptionsList.querySelector('li:nth-of-type(5) label').click();    
                break;
            case 'house':
                housingOptionsList.querySelector('li:nth-of-type(6) label').click();
                housingOptionsList.querySelector('li:nth-of-type(9) label').click();
                break;
            case 'no preference':
                housingOptionsList.querySelector('li.selectall span.all').click(); 
        }

        return Promise.resolve();
    }, data)

}

async function browsePage(page) {
    return page.evaluate(() => {    
        let rows = document.querySelectorAll('ul.rows > .result-row');
        let morePages = false;
        let data = [];
        console.log(rows);
        if (rows) {
            for (let row of rows) {
                let possibleLocation = row.querySelector('.result-hood');
                let location = possibleLocation? possibleLocation.textContent : null;
    
                let possibleBdr = row.querySelector('span.housing')
                let numBdr = possibleBdr? possibleBdr.textContent.trim().substring(0, 3) : null; // double check this
    
               
                listing = {
                    title: row.querySelector('a[data-id]').textContent,
                    location: location,
                    link: row.querySelector('a[data-id]').href,
                    price: row.querySelector('.result-price').textContent.substring(1),
                    numBdr: numBdr,
                    source: 'Craigslist'
                }
                data.push(listing);
            }  
            let nextPageButton = document.querySelector('.search-legend a[class="button next"]');
            if (nextPageButton) {
                morePages = getComputedStyle(nextPageButton).display !== 'none';
            }
        }
             
        return Promise.resolve({morePages: morePages, listings: data});
    });
}


