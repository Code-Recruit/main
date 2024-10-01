const identify = require('gtcs-identifier').getUser;
const express = require('express');
const app = express();
const fs = require('fs');

const {v4: uuidv4} = require('uuid');

const pug = require('pug');

const compiledListing = pug.compileFile('./views/listing.pug');

app.get('/create-listing', (req, res) => {
    let user = identify(req.ip);

    if (user !== undefined) {
        let id = uuidv4();

        let description = req.body;

        addToDb({creator: user, id: id, description: description});
    } else {
        res.sendStatus(401);
    }
});

app.get('/getuser/:id', (req, res) => {
    let id = req.params.id;

    res.send(getAccount(id));
});

app.post('/createUser', (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    
    let creationDate = Date.now();

    let id = uuidv4();

    if (getAccount(id) == null) {
        addAccount(id, username, email, creationDate);
        res.sendStatus(200);
    } else {
        res.sendStatus(409);
    }
});

function getAccount(id) {
    fs.readFile('database.json', (err, data) => {
        let db = JSON.parse(db);
        let usersDb = db['database-users'];

        for (let user of usersDb) {
            if (user.id == id) {
                return user;
            }
        }

        return null;
    })
}

function addAccount(id, username, email, creationDate) {
    fs.readFile('database.json', (err, data) => {
        if (err) {
            console.log('ERROR: ' + err);
        }

        let db = JSON.parse(data);
        let usersDb = db['database-users'];

        usersDb.push({id: id, username: username, email: email, creationDate: creationDate});

        db = JSON.stringify(db, null, 3);

        fs.writeFileSync('database.json', db);
    });
}

function addToDb(item, creator) {
    fs.readFile('database.json', (err, data) => {
        let db = JSON.parse(data);
        let dbListings = db['database-listings'];

        dbListings.push(item);
        
        let count = 0;

        for (let obj of dbListings) {
            if (obj.creator == creator) {
                count++;
            }
        }

        let flag = false;

        if (count == 4) {
            for (let i = 0; i < dbListings.length; i++) {
                if (obj.creator == creator) {
                    if (!flag) {
                        flag = true;
                        dbListings.splice(i, 1);
                    }
                }
            }
        }

        db = JSON.stringify(db, null, 3);

        fs.writeFileSync('database.json', db);
    });
}

app.get('/listing/:id', (req, res) => {
    res.send(compiledListing({id: req.params.id})); 
});

app.listen(3001, () => {
    console.log(`Listening on port: ${3001}`);
});