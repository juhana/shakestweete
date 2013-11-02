var fs = require( 'fs' ),
    Twit = require( 'twit' ),
    _ = require( 'underscore' )._;

var twitter,
    stats = {
        requests: 0
    };

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

    twitter.get(
        'search/tweets',
        { q: 'alas -filter:links', lang: 'en', count: 10 },
        function( error, reply ) {
            stats.requests++;
            if( error ) {
                throw new Error( error );
            }

            var tweet;

            // choose the first tweet that fits the bill
            _.find( reply.statuses, function( data ) {
                tweet = validateAndClean( data );

                return tweet;
            });

            if( !tweet ) {
                console.error( "Suitable seed tweet wasn't found, please try again in a while." );
                return;
            }

            console.dir( tweet );
        }
    );
});


/**
 * Check that the tweet is suitable for our purposes and clean it up,
 * except removing the @s
 *
 * @param tweet
 * @return boolean|object false if unsuitable tweet, a clean tweet object
 */
function validateAndClean( tweet ) {
    // reject users who don't tweet in English
    if( tweet.user.lang !== 'en' ) {
        return false;
    }

    // reject manual retweets
    if( /\bRT\b/.test( tweet ) ) {
        return false;
    }

    // remove trailing hashtags
    var text = tweet.text.replace( /( #[a-z_0-9]+)+$/i, '' );

    // any hashtags left? Reject if so
    if( text.indexOf( '#' ) > -1 ) {
        return false;
    }

    // Add a comma after the first @
    text = text.replace( /^(@[a-z_0-9]+) /i, '$1, ' );

    var actor = tweet.user.name;

    // try to clean up the username
    actor = actor
        .replace( /_/g, '' )
        .replace( /\w+/g, function( txt ){
            return txt.charAt( 0 ).toUpperCase() + txt.substr( 1 ).toLowerCase();
        });

    // reject if doesn't look like a name
    if( !/^[a-z\-0-9 .]+$/i.test( actor ) ) {
        return false;
    }

    return {
        text: text,
        username: tweet.user.screen_name,
        actor: actor,
        location: tweet.user.location
    };
}