const { query, sanitizeQuery, validationResult } = require('express-validator');
const craigsScraper = require('../scrapers/CraigsScraper');
const trovitScraper = require('../scrapers/TrovitScraper');

module.exports = [ 
    query("location", "Invalid input in location field.")
        .matches(/^([a-zA-ZÀ-ÖØ-öø-ÿ]|\s|\.|\,|\'|\-)*$/),
    sanitizeQuery("city").escape(),

    query("price-min", "Invalid input in min price field.")
        .isLength({min: 1}).trim()
        .matches(/^\d+$/), 

    query("price-max", "Invalid input in max price field.")
        .isLength({min: 1}).trim()
        .matches(/^\d+$/), 

    (req, res, next) => {
        const errors = validationResult(req);   
        let data = req.query;
        let input = {
            location: data.location, 
            type: data.type,
            "price-min": data["price-min"],
            "price-max": data["price-max"],
            "bdr-min": data["bdr-min"], 
            "bdr-max": data["bdr-max"], 
            "bth-min": data["bth-min"],
            "bth-max": data["bth-max"],
        }

        if (!errors.isEmpty()) {
            res.render("index", {
                data: input,
                errors: errors.array({onlyFirstError: true})
            });  
        } else {
            let list = [];
            // for (i = 0; i < 50; i++) {
            //     let obj = {price: Math.floor(Math.random() * 2000)};
            //     list.push(obj);   
            // }

            Promise.all([
                craigsScraper(input),
                trovitScraper(input)
            ]).then((results) => {
                list = [...results[0], ...results[1]];
                res.render("search", {data: input, listings: list});
            }).catch((err) => {
                console.log('error scraping');
                console.error(err);
                next(err);
            });
        }
}];

