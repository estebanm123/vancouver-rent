const puppeteer = require('puppeteer');
const scraper = require('./Scraper');

 module.exports = async (data) => {
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
    const browser = await puppeteer.launch({'args' : [
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]});
    const page = await browser.newPage();

    const link = setUpLink(data);
    await scraper.initialize(page, link);

    let listings = [];  
    let morePages = true;
    i = 0; // scrapes the newest 2 pages in case there are too many results (about 75 listings)
    while (morePages && i < 2) {
        i++;
        if (i == 2) {
            await page.evaluate( async ()=> {
                while(!document.querySelector("#cboxLoadedContent")) {
                    await new Promise(x => setTimeout(x, 250));
                }
                console.log('escaped');
                document.elementFromPoint(5, 5).click();
            });
            await page.waitFor(1000);
        } 
        let results = await browsePage(page, data);
        listings = [...listings, ...results.listings];
        if (results.morePages) {
            await scraper.linkNavigate(page, '#paginate a:last-child');
        } else { 
            morePages = false;
        }    
    }
    browser.close();
    console.log('trovit ' + listings.length);
    return Promise.resolve(listings);
}

async function browsePage(page, input) {
    return page.evaluate((input) => {
        let rows = document.querySelectorAll('#wrapper_listing li');
        let data = [];
        let morePages = false;
        if (rows) {
            for (let row of rows) { 
                let possibleBdr = row.querySelector('span[itemprop="numberOfRooms"]');
                if (possibleBdr && possibleBdr.textContent > input['bdr-max']) {
                    continue;
                } 
                let numBdr = possibleBdr? possibleBdr.textContent + 'BR' : null;

                listing = {
                    title: row.querySelector('h4[itemProp="description"] a').textContent,
                    location: null,
                    link: row.querySelector('h4[itemProp="description"] a').href,
                    price: row.querySelector('.price').textContent.substring(2).replace(',', '').trim().split(' ')[0],
                    numBdr: numBdr,
                    source: row.querySelector('.source span').textContent
                }
                data.push(listing);
            }
            let lastLink = document.querySelector('#paginate a:last-child');
            if (lastLink) {
                morePages = lastLink.textContent === 'Next »';
            }
        }
        return Promise.resolve({morePages: morePages, listings: data});
    }, input);
}

function setUpLink(data) {
    let bdrMin = (data['bdr-min'] === 'min')? "" : (data['bdr-min'] === '5+')? 'rooms_min.5/' :  'rooms_min.' + data['bdr-min'] + '/';
    let bthMin = (data['bth-min'] === 'min')? "" : (data['bth-min'] === '5+')? 'bathrooms_min.5/' :'bathrooms_min.' + data['bth-min'] + '/';
    let type = (data['type'] === 'no preference')? "" : (data['type'] === 'apartment')? 'property_type.Apartment/' : 'property_type.House/';
    return `https://property.trovit.ca/index.php/cod.search_homes/type.2/what_d.vancouver%20${data.location}/sug.0/isUserSearch.1/order_by.relevance/price_min.${data['price-min']}/price_max.${data['price-max']}/${bdrMin}${bthMin}${type}resultsPerPage.150`;
}
