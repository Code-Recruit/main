const fs = require('fs');
const express = require('express');

const app = express();

const cors = require('cors');

app.use(cors());

const PORT = process.env.PORT || 3000;

const safemode = true;

let allKeywords;
let allSites;

fs.readFile('./database-keywords.json', (err, data) => {
    if (err) {
        console.log('ERROR: ' + err);
    }

    fs.readFile('./database-sites.json', (err2, data2) => {
        if (err2) {
            console.log('ERROR: ' + err);
        }

        allKeywords = JSON.parse(data.toString());

        allSites = JSON.parse(data2.toString());
    })
});

async function mainFunction(search) {
    let searchArray = search.trim().split(' ');

    let results = [];

    function addResult(site, amount, title, description = null) {
        let flag = false;
    
        for (let result of results) {
            if (result.site == site) {
                result.amount += amount;   
                flag = true;
            }
        }
    
        if (!flag) {
            results.push({'site': site, 'amount': amount, 'title': title, 'description': description});
        }
    }

    for (let word of searchArray) {
        for (let obj of allKeywords) {
            if (obj.keyword == word) {
                for (let site of obj.sites) {
                    for (let site2 of allSites) {
                        if (site2.site == site) {
                            for (let key of site2.keywords) {
                                if (key.keyword == word) {
                                    addResult(site, key.amount, site);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    results.sort((a, b) => b.amount - a.amount);

    return results;
}

app.get('/search', async (req, res) => {
    let search = req.query.q.split('+').join(' ');

    let results = await mainFunction(search);

    // Define forbidden keywords
    let forbiddenKeywords = new Set();

    if (safemode) {
        forbiddenKeywords = new Set([
            'nudity', 'porn', 'nude', 'explicit', 'sex', 'hot', 'dick',
            'breasts', 'ass', 'stripper', 'pornstar', 'porno', 'pornography', 'p*rn', 'pornmodel', 'strippers', 'pornstars', 'pornmodels'
        ]);
    }

    // Create a set of forbidden sites
    let forbiddenSites = new Set();

    // Populate forbidden sites set
    for (let keyword of allKeywords) {
        if (forbiddenKeywords.has(keyword.keyword)) {
            for (let site of keyword.sites) {
                forbiddenSites.add(site);
            }
        }
    }

    // Filter out the forbidden sites from the results
    results = results.filter(result => {
        if (forbiddenSites.has(result.site)) {
            return false; // Exclude the forbidden site
        }
        return true; // Keep the allowed site
    });
 
    res.status(200).send(results);
});

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});