var fs = require( 'fs' ),
    Twit = require( 'twit' ),
    _ = require( 'underscore' )._;

var actors = [],
    minWords = 50000,
    script = [],
    stats = {
        requests: 0,
        tweets: 0,
        words: 0
    },
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

    twitter.get(
        'search/tweets',
        { q: 'alas -filter:links', lang: 'en', count: 10 },
        function( error, reply ) {
            stats.requests++;
            if( error ) {
                throw new Error( error );
            }

            var tweet, chosenData;

            // choose the first tweet that fits the bill
            _.each( reply.statuses, function( data ) {
                if( !tweet ) {
                    tweet = validateAndClean( data );
                    chosenData = data;
                }
            });

            if( !tweet ) {
                console.error( "Suitable seed tweet wasn't found, please try again in a while." );
                return;
            }

            addActor( tweet.actor );
            setActorInfo( chosenData.user );

            // Pull 200 tweets from the user and validate them
            getTweets( tweet.actor, main )
        }
    );
});


/**
 * The main loop that collects the text
 * 
 * @param newTweets
 */
function main( newTweets ) {
    _.each( newTweets, function( tweet ) {
        script.push( tweet );
        stats.words += countWords( tweet.text );
    });

    if( stats.words >= minWords ) {

    }

    getNextActor( function( nextActor ) {
        if( nextActor === undefined ) {
            throw new Error( "Didn't find enough actors to generate " + minWords + " words, stopping at " + stats.words + " words." );
        }

        nextActor.appeared = true;

        getTweets( nextActor, main );
    });
}


/**
 * Add an actor to the actor list and make sure it's unique
 *
 * @param actor string
 */
function addActor( actor ) {
    // if the actor is already seen, do nothing
    if( _.contains( actors, actor ) || _.where( actors, { name: actor } ).length ) {
        return;
    }

    actors.push( actor );
}


/**
 * Count words of a string
 *
 * @param text
 * @returns {Number}
 */
function countWords( text ) {
    return text.split( ' ' ).length;
}


/**
 * Fetch more specific user data from Twitter
 */
function fetchActorData() {

}


function getNextActor( callback ) {
    var index = _.find( actors, function( data ) {
        return typeof data === 'string' || data.appeared === false;
    });

    // if the actor is a string, process the actors to turn it into an object
    if( typeof actors[ index ] === 'string' ) {
        fetchActorData();
        getNextActor( callback );
        return;
    }

    callback( actors[ index ].screen_name );
}


/**
 * Get a user's latest tweets.
 *
 * @param actor
 * @param callback function A callback function called after the request is done.
 *  The AJAX response object is given as
 */
function getTweets( actor, callback ) {
    twitter.get(
        'statuses/user_timeline',
        { screen_name: actor, count: 200 },
        function( error, reply ) {
            stats.requests++;
            if( error ) {
                throw new Error( error );
            }

            var result = [];

            // process replies
            _.each( reply, function( tweet ) {
                var clean = validateAndClean( tweet );

                if( clean ) {
                    result.push( clean );
                }
            });

            // return tweets in reversed chronological order
            callback( result.reverse() );
        }
    );
}


function setActorInfo( user ) {
    var index = _.indexOf( actors, user.screen_name );

    if( index === -1 ) {
        // we assume the actor exists in the array as a string
        throw new Error( 'Actor not found in setActorInfo()' );
    }

    actors[ index ] = user;
}


/**
 * Check that the tweet is suitable for our purposes and clean it up
 *
 * @param tweet
 * @return boolean|object false if unsuitable tweet, a clean tweet object
 */
function validateAndClean( tweet ) {
    // reject users who don't tweet in English
    if( tweet.user.lang !== 'en' || tweet.lang !== 'en' ) {
        return false;
    }

    // remove trailing hashtags
    var text = tweet.text.replace( /( #[a-z_0-9]+)+$/i, '' );

    // any hashtags left? Reject if so
    if( text.indexOf( '#' ) > -1 ) {
        return false;
    }

    // reject urls
    if( text.indexOf( 'http' ) > -1 ) {
        return false;
    }

    // Reword retweets
    text = text.replace( /^rt /i, 'Thus spoke ' );

    // Add a comma after the first @
    text = text.replace( /^(@[a-z_0-9]+) /i, '$1, ' );

    // remove double-spaces and line breaks
    text = text.replace( /(\n? +)|\n/g, ' ' );

    var actor = tweet.user.name;

    // try to clean up the username
    actor = actor
        .replace( /_/g, ' ' )
        .replace( /\w+/g, function( txt ){
            return txt.charAt( 0 ).toUpperCase() + txt.substr( 1 ).toLowerCase();
        })
        .replace( /([a-z])([A-Z])/, '$1 $2' );

    // reject if doesn't look like a name
    if( !/^([A-Z][a-z\-. ]+)+$/.test( actor ) ) {
        return false;
    }

    // find new actors
    var at,
        atRegex = /@[a-z0-9_]+/gi;

    while( ( at = atRegex.exec( text ) ) !== null ) {
        addActor( at[ 0 ].substr( 1 ) );
    }

    return {
        actor: tweet.user.screen_name,
        text: text,
        timestamp: new Date( tweet.created_at )
    };
}