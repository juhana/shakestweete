Shakestweete
============

Shakestweete generates Shakespearean plays from semi-random tweets from Twitter.

Written for the [2013 NaNoGenMo](https://github.com/dariusk/NaNoGenMo).


Installation
------------

You need [Node.js](http://nodejs.org) and [npm](https://npmjs.org). Download/clone the project and command `npm install`
in the project root to install dependencies.


Setup
-----

You need to create and register a Twitter application at http://dev.twitter.com. (It's silly, but Twitter requires
authentication even if you're only reading public tweets.)

Once you have the application registered and you have generated the access tokens, create a credentials.json
file that has this content:

```
{
    "consumer_key":         "YOUR_CONSUMER_KEY",
    "consumer_secret":      "YOUR_CONSUMER_SECRET",
    "access_token":         "YOUR_ACCESS_TOKEN",
    "access_token_secret":  "YOUR_ACCESS_TOKEN_SECRET"
}
```

The same content is in the file credentials.example.json which you can edit and rename to credentials.json.


Usage
-----

Command `node shakestweete.js` to run the generator.


Status
------

It's a bit buggy and there's maybe 50/50 chance of it managing to generate a 50,000 word output per run. It's unlikely that I'll ever fix it, but feel free to fork and modify to heart's content.