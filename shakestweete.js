var fs = require('fs' ),
    Twit = require('twit' ),
    twitter;

var titles = [
    "All's Well That Tweets Well",
    "As You Tweet It",
    "The Comedy of Twitter",
    "Love's Labour's Tweet",
    "Tweet for Tweet",
    "The Merchant of Twitter",
    "The Merry Wives of Twitter",
    "A Midsummer Night's Tweet",
    "Much Ado About Twitter",
    "The Tweeting of the Shrew",
    "The Tweet",
    "Twelfth Tweet",
    "The Two Gentlemen of Twitter",
    "The Two Noble Tweeters",
    "The Winter's Tweet",
    "%USER% and %USER%",
    "%USER% of Twitter",
    "The Tragedy of %USER%, Prince of Twitter",
    "King %USER%",
    "%USER% IV, Part I",
    "%USER% IV, Part II"
];

fs.readFile( 'credentials.json', 'utf8', function( error, data ) {
    if( error ) {
        console.error( error + '\nSee README.md for instructions.' );
        return;
    }

    twitter = new Twit( JSON.parse( data ) );

    twitter.get( 'search/tweets', { q: 'alas -filter:links', lang: 'en', count: 2 }, function( error, reply ) {
    });
});