// greeting message creator

var settings = require("./settings.json");
var profiles = require("./profiles.json");

function introduce(client, channel, nick) {
    var intros = [
        "hmms...",
        "announces:",
        "traces through her list...",
        "skims through her database...",
        "boots up..."
    ];

    var stammers = [
        nick + ",",
        "Let's see... " + nick + "...",
        "Er... " + nick + "... Ah! Here you are:"
    ];

    var output = "";

    var intro = Math.floor(Math.random() * intros.length);
    output += intros[intro] + " \"";

    var stammer = Math.floor(Math.random() * stammers.length);
    output += stammers[stammer];

    output += describe(nick);

    output += "\"";

    client.action(channel, output);
}

function describe(nick) {
    var output = "";

    if (profiles[nick]["description"]) {
        output += " " + profiles[nick].description + ".";
    }
    if (profiles[nick]["image"]) {
        output += " ( " + profiles[nick].image;
        if (profiles[nick]["link"]) {
            output += " | " + profiles[nick].link;
        }
        output += " )";
    }
    else if (profiles[nick]["link"]) {
        output += " ( " + profiles[nick].link + " )";
    }

    return output;
}

function notify(client, nick) {
    client.notice(nick, "Hello, I am the new greeting bot. My name is " + settings.username + ". " +
                        "If you want to fill your description to avoid repetitive questions like \"who/what are you?\", " +
                        "please type /msg " + settings.username + " " + settings.prefix + "help for instructions. " +
                        "You won't see this message anymore if you have a description, as well.");
}

exports.introduce = introduce;
exports.describe = describe;
exports.notify = notify;
