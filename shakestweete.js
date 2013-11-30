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

function progress( text ) {
    console.error( text );
}

fs.readFile( 'credentials.json', 'utf8', function( error, data ) {
    if( error ) {
        console.error( error + '\nSee README.md for instructions.' );
        return;
    }

    twitter = new Twit( JSON.parse( data ) );

    if( process.argv.length > 2 ) {
        // if the seed actor was given in the command line
        addActor( process.argv[ 2 ] );

        fetchActorData( function() { actors[ 0 ].appeared = true; getTweets( process.argv[ 2 ], main ) } );
    }
    else {
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
                chosenData.user.appeared = true;

                progress( 'Seed actor is ' + chosenData.user.screen_name + '.' );
                // Pull 200 tweets from the user and validate them
                getTweets( tweet.actor, main )
            }
        );
    }
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

    progress( 'At ' + stats.words + ' words (' + ( minWords - stats.words ) + ' remaining).' );
    if( stats.words >= minWords ) {
        processUsernames( printPlay, true );
        return;
    }

    getNextActor( function( nextActor ) {
        if( nextActor === undefined ) {
            throw new Error( "Didn't find enough actors to generate " + minWords + " words, stopping at " + stats.words + " words." );
        }

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
    if( _.contains( actors, actor ) || _.where( actors, { screen_name: actor } ).length ) {
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
 * Fetch more specific user data from Twitter.
 */
function fetchActorData( callback ) {
    progress( 'Retrieving user data...' );
    var unknownActors = _.filter( actors, function( data ) {
        return typeof data === 'string';
    });

    if( unknownActors.length === 0 ) {
        callback( false );
    }

    // Twitter has limit of 100 users per request

    if( unknownActors.length > 100 ) {
        unknownActors = unknownActors.slice( -100 );
    }


    twitter.get(
        'users/lookup',
        { screen_name: unknownActors.join(',') },
        function( error, reply ) {
            stats.requests++;
            if( error ) {
                throw new Error( error );
            }

            var ok = false;

            _.each( reply, function( data ) {
                if( setActorInfo( data ) ) {
                    ok = true;
                }
            });

            progress( reply.length + ' users found.' );

            callback( ok );
        }
    );
}

function getActorName( screen_name ) {
    var name = _.findWhere( actors, { screen_name: screen_name } );
    return name ? name : false;
}

function getNextActor( callback ) {
    var actor = _.find( actors, function( data ) {
        return typeof data === 'string' || ( data.appeared === false && data.valid === true );
    });

    if( actor === -1 ) {
        throw new Error( "Didn't find enough actors to generate " + minWords + " words, stopping at " + stats.words + " words." );
    }

    // if the actor is a string, process the actors to turn it into an object
    if( typeof actor === 'string' ) {
        fetchActorData( function( ok ) {
            if( ok ) {
                getNextActor( callback );
            }
            else {
                throw new Error( 'Only string user data found' );
            }
        } );
        return;
    }

    progress( 'Next actor is ' + actor.screen_name + '.' );
    actor.appeared = true;

    callback( actor.screen_name );
}


/**
 * Get a user's latest tweets.
 *
 * @param actor
 * @param callback function A callback function called after the request is done.
 *  The AJAX response object is given as
 */
function getTweets( actor, callback ) {
    progress( 'Retrieving tweets for ' + actor + '...' );
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

            progress( result.length + ' tweets found.' );

            // return tweets in reversed chronological order
            callback( result.reverse() );
        }
    );
}


function printPlay() {
    script = _.sortBy( script, 'timestamp' );
    var previous_actor = null,
        actor_name;


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
        "The Winter's Tweet"
    ];

    var title = titles[ Math.floor( Math.random() * titles.length ) ];


    process.stdout.write( '\n\n        ' + title.toUpperCase() );
    process.stdout.write( '\n\n        A tragedy in one act\n\n\n\n' );

    _.each( script, function( line ) {
        if( previous_actor !== line.actor ) {
            previous_actor = line.actor;
            actor_name = getActorName( line.actor );
            if( typeof actor_name.name === 'string' ) {
                process.stdout.write( '\n' + actor_name.name.toUpperCase() + ': ' );
            }
        }
        else {
            process.stdout.write( '  ' );
        }

        process.stdout.write( line.text + '\n' );
    });
}

function processUsernames( callback, firstRun, oldActorCount, oldNewActors ) {
    var clear = true,
        actorCount = 0,
        newActors = 0;

    _.each( script, function( line ) {
        var regex = /@[a-z0-9_]+/gi,
            result,
            actor;

        while( result = regex.exec( line.text ) ) {
            result = result[ 0 ];
            actor = getActorName( result.substr( 1 ) );

            if( actor ) {
                line.text = line.text.replace( result, actor.name );
                actorCount++;
            }
            else {
                addActor( result.substr( 1 ) );
                clear = false;
                newActors++;
            }
        }
    });

    progress( "Changed the names of " + actorCount + " actors and found " + newActors + " new" );

    if( clear || ( !firstRun && actorCount === 0 ) || ( actorCount === oldActorCount && newActors == oldNewActors ) ) {
        callback();
    }
    else {
        fetchActorData( function() { processUsernames( callback, false, actorCount, newActors ); } );
    }
}

function setActorInfo( user ) {
    var index = _.indexOf( actors, user.screen_name );

    if( index === -1 ) {
        console.error( user.screen_name + ' not found in array' );
        return false;
    }

    actors[ index ] = user;

    user.appeared = false;

    // discard protected users
    if( user.protected ) {
        user.valid = false;
        return false;
    }

    // try to clean up the username
    var name = user.screen_name
        .replace( /_/g, ' ' )
        .replace( /\w+/g, function( txt ){
            return txt.charAt( 0 ).toUpperCase() + txt.substr( 1 ).toLowerCase();
        })
        .replace( /([a-z])([A-Z])/, '$1 $2' );

    // reject if doesn't look like a name
    if( !/^([A-Z][a-z\-. ]+)+$/.test( name ) ) {
        user.valid = false;
        return false;
    }

    user.valid = true;

    return true;
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

    /*
    // Reword retweets
    text = text.replace( /^rt /i, 'Thus spoke ' );
    */
    // Reject retweets (there's just too many of them)
    if( text.indexOf( 'RT ' ) === 0 || text.indexOf( 'rt ' ) === 0 ) {
        return false;
    }

    // Add a comma after the first @
    text = text.replace( /^(@[a-z_0-9]+) /i, '$1, ' );

    // remove double-spaces and line breaks
    text = text.replace( /(\n? +)|\n/g, ' ' );

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