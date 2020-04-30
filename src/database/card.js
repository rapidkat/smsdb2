"use strict";
var configuration = require('../configuration');
var _ = require('underscore');
var pg = require('pg');
var logger = require('../logger');
var validationHelper = require('../helpers/validation-helper');
var db = require('../database/db');
var postgresHelper = require('../helpers/postgres-helper');

var neo4j = require('neo4j');
var db = new neo4j.GraphDatabase('https://neo_kaya_stamm_gold:UInc5m4dyhcQOBcelu3YlVZxaYQyMxTyxqE9VVPu@neo-kaya-stamm-gold.gce.graphstory.com:7473');

function SmsResponse(json) {
    this.smsData = {};
    this.processedItems = 0;

    if (json) {
        this.cardData.id = json.id;
        this.cardData.url = json.url;
        this.cardData.title = json.title;
        this.cardData.source_name = json.source_name;
        this.cardData.html_display = json.html_display;
        this.cardData.thumbnail_image_url = json.thumbnail_image_url;
        this.cardData.is_website = json.is_website;
        this.cardData.i_frameable = json.i_frameable;
        this.cardData.is_public_rooms_content = json.is_public_rooms_content;
        this.cardData.is_discoverable_content = json.is_discoverable_content;
        this.cardData.preset = json.preset;
        this.cardData.created_at = json.created_at;
        this.cardData.updated_at = json.updated_at;
        this.cardData.content_type = json.content_type;
        this.cardData.skip_iframe_test = json.skip_iframe_test;
        this.cardData.source_name_static = json.source_name_static;
        this.cardData.title_static = json.title_static;
        this.cardData.html_display_static = json.html_display_static;
        this.cardData.thumbnail_image_url_static = json.thumbnail_image_url_static;
        this.cardData.skip_embedly_update = json.skip_embedly_update;
        this.cardData.published_at = json.published_at;
        this.cardData.i_frameable_validated = json.i_frameable_validated;
        this.cardData.url_hash = json.url_hash;
        this.cardData.shares_count = json.shares_count;
        this.cardData.views_count = json.views_count;
        this.cardData.source_id = json.source_id
    }
    else {
        this.cardData.id = -1;
        this.cardData.url = "";
        this.cardData.title = "";
        this.cardData.source_name = "";
        this.cardData.html_display = "";
        this.cardData.thumbnail_image_url = "";
        this.cardData.is_website = false;
        this.cardData.i_frameable = true;
        this.cardData.is_public_rooms_content = false;
        this.cardData.is_discoverable_content = false;
        this.cardData.preset = false;
        this.cardData.created_at = postgresHelper.pgFormatDate(Date.now());
        this.cardData.updated_at = postgresHelper.pgFormatDate(Date.now());
        this.cardData.content_type = "";
        this.cardData.skip_iframe_test = false;
        this.cardData.source_name_static = false;
        this.cardData.title_static = false;
        this.cardData.html_display_static = false;
        this.cardData.thumbnail_image_url_static = false;
        this.cardData.skip_embedly_update = false;
        this.cardData.published_at = postgresHelper.pgFormatDate(Date.now());
        this.cardData.i_frameable_validated = false;
        this.cardData.url_hash = "";
        this.cardData.shares_count = 0;
        this.cardData.views_count = 0;
        this.cardData.source_id = 0
    }

    this.create = function (item_ids, callback) {

        var validationResult = validationHelper.ValidateCard(JSON.stringify(this.cardData));
        var card = this.cardData;

        if (validationResult) {
            var tasks = [];
            tasks.push(function (client, cb) {
                var queryText = 'INSERT INTO cards(url, title, source_name, html_display, thumbnail_image_url, is_website, i_frameable,';
                queryText += 'is_public_rooms_content, is_discoverable_content, preset, created_at, updated_at, content_type, skip_iframe_test,';
                queryText += 'source_name_static, title_static, html_display_static, thumbnail_image_url_static, skip_embedly_update,';
                queryText += 'published_at, i_frameable_validated, url_hash, shares_count, views_count, source_id)';
                queryText += 'VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25) RETURNING id';

                var queryValues = [card.url, card.title, card.source_name, card.html_display, card.thumbnail_image_url,
                    card.is_website, card.i_frameable, card.is_public_rooms_content, card.is_discoverable_content,
                    card.preset, card.created_at, card.updated_at, card.content_type, card.skip_iframe_test,
                    card.source_name_static, card.title_static, card.html_display_static, card.thumbnail_image_url_static,
                    card.skip_embedly_update, card.published_at, card.i_frameable_validated, card.url_hash,
                    card.shares_count, card.views_count, card.source_id];

                logger.info("database.card.create", 'creating card', null);

                client.query(queryText, queryValues, cb);

            }.bind(this));

            
            for (var i = 0; i < item_ids.length; i++) {

                tasks.push(function (client, results, cb) {
                    var cardId = results.rows[0].id;
                    card.id = cardId; 
                    
                    var itemId = item_ids[this.processedItems];

                    console.log ('incrementing processedItems, now : ', this.processedItems);
                    this.processedItems += 1;
                    
                    console.log('card_item, itemID -> ', itemId );
                    
                    var queryText = 'INSERT INTO card_items(card_id, item_id, created_at, updated_at)';
                    queryText += 'VALUES($1, $2, $3, $4) RETURNING card_id AS id';

                    var queryValues = [cardId, itemId, postgresHelper.pgFormatDate(Date.now()), postgresHelper.pgFormatDate(Date.now())];
                    logger.info("database.card.create", 'creating card item', null);
                    client.query(queryText, queryValues, cb);
                }.bind(this));

            }

            db.waterfall(tasks, callback);
        }
        else {
            logger.error("database.card.create", 'validation failed', validationResult);
        }

    };

    // Implements call to check if the url_hash supplied already exists
    this.doesCardUrlExist = function () {
        var card = this.cardData;

        logger.info("database.card.doesCardUrlExit", 'checking ', card);
        
        return new Promise(
            function (resolve, reject) {
                pg.connect(configuration.PG_CONNECTION, function (err, client, done) {
                    if (err) {
                        logger.error("database.card.doesCardUrlExit", 'Connecting to database ', err);
                        reject(err);
                    }
                    
                    var queryText = "SELECT id, url, source_id FROM cards WHERE url_hash = " + card.url_hash;
                    
                    client.query(queryText , function (err, result) {
                        done();

                        if (err) {
                            logger.error("database.card.doesCardUrlExit", 'Running query ' + queryText , err);
                            reject(err);
                            return;
                        }
                        if (result.rows.length != 1) {
                            logger.info("database.card.doesCardUrlExit", 'not found ');
                            resolve(false);
                            return;
                        }

                        for (var i = 0; i < result.rows.length; i++) {
                            if (card.url.trim() == result.rows[i].url.trim()) {
                                logger.info("database.card.doesCardUrlExit", 'found ');
                                resolve(result.rows[i]);
                            }
                        }

                        resolve(false);

                    });
                });
            });
    };

    // Return the latest card for each interest
    //this.getLatestCardsPerInterest = function (exclusions, userInterests) {
    this.getLatestCardsPerInterest = function (userSources, userInterests) {

        return new Promise(
            function (resolve, reject) {
                var cardList = [];
                var processedRows = 0;

                pg.connect(configuration.PG_CONNECTION_FOLLOWER, function (err, client, done) {
                    if (err) {
                        logger.error('Card.getLatestCardsPerInterest', "Error", err);
                        done();
                        reject(err);
                    }

                                        for (var i = 0; i < userInterests.rows.length; i++){
                        var exclusionArray = '';
                        var itemExclusions = _.where(userSources, {"item_id": userInterests.rows[i].item_id, "excluded" : true});
                        if (itemExclusions.length != 0){
                            var excludedSources = "{";
                            for (var j=0; j<itemExclusions.length; j++){
                                if (j > 0){
                                    excludedSources += ",";
                                }
                                excludedSources += itemExclusions[j].source_id;
                            }
                            excludedSources +=  "}'::int[]) ";
                            exclusionArray = "AND cards.source_id !=ALL('" + excludedSources;
                        }

                        var customArray = '';
                        var customSourceList = _.where(userSources, {"item_id": userInterests.rows[i].item_id, "excluded" : false});
                        if (customSourceList.length != 0){
                            var customSources = ")";
                            for (var k=0; k < customSourceList.length; k++){
                                if (k > 0){
                                    customSources += ",";
                                }
                                customSources += customSourceList[k].source_id;
                            }
                            customSources +=  ")";
                            customArray = "OR cards.source_id IN " + customSources;
                        }

                        var queryText = "SELECT cards.*, card_items.* ";
                        queryText += "FROM cards, card_items ";
                        queryText += "WHERE card_items.item_id = " + userInterests.rows[i].item_id + " ";

                        if (customArray != ''){
                            debugger;
                            queryText += "AND (cards.id = card_items.card_id ";
                            queryText += customArray + ") ";
                        }
                        else {
                            queryText += "AND cards.id = card_items.card_id ";
                        }

                        queryText += "AND cards.source_id IS NOT NULL ";
                        queryText += "AND cards.created_at  > NOW()::DATE - 1 ";
                        queryText += exclusionArray ;
                        queryText += "ORDER BY cards.created_at DESC ";
                        queryText += "LIMIT(1)";
                                                
                        var query = client.query(queryText);
                        query.on('error', function(error) {
                            debugger;
                            logger.error('Card.getLatestCardsPerInterest', 'Error with query : ' + queryText, error);
                            done();
                            reject(error)
                        });

                        query.on('row', function(row) {
                            cardList.push(row);
                            //done();
                        });

                        query.on('end', function(result) {
                            done();
                            processedRows ++;
                            
                            if (processedRows == userInterests.rows.length) {
                                resolve(cardList);
                            }
                        });
                    }
                });
           }); 
    };

    // Return the latest card for each interest
    //this.getLatestCardsPerInterest = function (exclusions, userInterests) {
    this.getLatestCardsPerInterestNeo4j = function (userInterests) {

        return new Promise(
            function (resolve, reject) {
                var rows = [];
                var resultCount = 0;
                
                for (var i=0; i < userInterests.rows.length; i++) {
                    var item_id = userInterests.rows[i].roomItem.properties.item_id;

                    db.cypher({
                        query: "MATCH (:RoomItem{item_id:{item_id}, user_id:{user_id}})-[CONTENT_FEED]->(:ContentFeed)-[:CONSUMES_CONTENT_OF]-(:Source{active: 't'})-[:CREATED]->(card:Card) RETURN card ORDER BY card.pg_id DESC LIMIT 1",
                        params: {user_id: userInterests.user.user_id, item_id: item_id}
                    }, function (err, results) {
                        resultCount ++;
                        //console.log(err, results);
                        if (err) {
                            logger.error("UserInterest.getCards", "Query Error - " + err);
                            reject(err);
                        } else {
                            if (!results) {
                                console.log('No user found.');
                                
                                //resolve({"user": user, 'rows': []});
                            } else {
                                //resolve({"user": user, 'rows': results});
                                if (results.length != 0){
                                    rows.push(results);
                                }
                            }
                            if (resultCount == userInterests.rows.length) {
                                resolve({"user": userInterests.user, 'rows': rows});
                            }
                        }
                    });
                }
                
            });
    };




    // Update the source ID for a card
    this.updateSourceId = function (cardId, sourceId) {

        logger.info('Card.updateSourceId', 'cardId = ' + cardId, + ' sourceId = ' + sourceId , error);

        return new Promise(
            function (resolve, reject) {
                pg.connect(configuration.PG_CONNECTION, function (err, client, done) {
                    if (err) {
                        logger.error('Card.updateSourceId', 'Error connecting to Database ' , error);
                        reject(err);
                    }

                    var queryText = "UPDATE cards SET source_id = " + sourceId;
                    queryText += " WHERE id = " + cardId;

                    logger.info('Card.updateSourceId', 'executing query ' + queryText , []);
                    
                    client.query(queryText , function (err, result) {

                        logger.info('Card.updateSourceId', 'query ' + queryText , []);

                        done();

                        if (err) {
                            logger.error('Card.updateSourceId', 'Error with query : ' + queryText, error);
                            reject(err);
                            return;
                        }


                        if (result.rowCount != 1) {
                            logger.info('Card.updateSourceId', 'No updated row ' , []);
                            resolve(false);
                            return;
                        }

                        logger.info('Card.updateSourceId', 'Resolving true ' , []);
                        resolve(true);

                    });
                });
            });
    };

}

module.exports = Card;

