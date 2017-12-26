// IRC bot framework

var irc = require("irc");

var greetings = require("./greetings.js");
var pm = require("./pm.js");

var settings = require("./settings.json");
var profiles = require("./profiles.json");

var client = new irc.Client(settings.network, settings.username, settings.parameters);
var duplicates = [];

client.addListener("registered", () => {
    setInterval( () => {
        duplicates = [];
        console.log("resetting duplicates...");
    }, settings.cooldown * 1000 * 60 * 60);
});

client.addListener("pm", (nick, text, message) => {
    if (!text.startsWith(settings.prefix)) {
        client.say(nick, "I don't recognize this syntax. Type " + settings.prefix + "help for more information.");
    }
    else {
        var command = text.substring(settings.prefix.length).split(" ")[0];
        var suffix = text.substring(settings.prefix.length + command.length + 1);

        if (pm.commands[command]) {
            if (pm.commands[command]["admin"] && !settings.admins.includes(nick)) {
                client.say(nick, "You do not have permission to use that command.");
            }
            // check if suffix is required and not provided
            else if (pm.commands[command]["suffix"] && /^\s*$/.test(suffix)) {
                client.say(nick, pm.commands[command]["help"]);
            }
            else {
                pm.commands[command].process(client, nick, suffix);
            }
        }
        else {
            client.say(nick, "I don't recognize this command. Type " + settings.prefix + "help for more information.");
        }
    }
});

client.addListener("message#", (nick, channel, text, message) => {
    if ((text.startsWith(settings.username + ", who is ") || text.startsWith(settings.username + ", what is "))
        && text.charAt(text.length-1) === "?") {

        if (text.startsWith(settings.username + ", who is ")) {
            var query = text.substring(settings.username.length + 9, text.length-1);
        }
        else {
            var query = text.substring(settings.username.length + 10, text.length-1);
        }

        if (profiles[query]) {
            greetings.introduce(client, channel, query);
        }
        else {
            client.say(channel, "Sorry, I don't recognize the name " + query + ".");
        }
    }
});

client.addListener("join", (channel, nick, message) => {
    processNick(channel, nick);
});

client.addListener("nick", (oldNick, newNick, channels, message) => {
    for (channel in channels) {
        processNick(channels[channel], newNick);
    }
});

client.addListener("error", (message) => {
    console.log("error: ", message);
});

function processNick(channel, nick) {
    if (profiles[nick]) {
        if (!duplicates.includes(nick)) {
            greetings.introduce(client, channel, nick);
            duplicates.push(nick);
        }
    }
    else {
        greetings.notify(client, nick);
    }
}
