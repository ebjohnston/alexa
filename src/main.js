// IRC bot framework

var irc = require("irc");

var greetings = require("./greetings.js");
var pm = require("./pm.js");

var settings = require("./settings.json");
var profiles = require("./profiles.json");

var client = new irc.Client(settings.network, settings.username, settings.parameters);

client.addListener("join", (channel, nick, message) => {
    if (profiles[nick]) {
        greetings.introduce(client, channel, nick);
    }
    else {
        greetings.notify(client, nick);
    }
});

client.addListener("pm", (nick, text, message) => {
    if (!text.startsWith(settings.prefix)) {
        client.say(nick, "I don't recognize this syntax. Type " + settings.prefix + "help for more information.");
    }
    else {
        var command = text.substring(settings.prefix.length).split(" ")[0];
        var suffix = text.substring(settings.prefix.length + command.length + 1);

        if (pm.commands[command]) {
            if (pm.commands[command].suffix && /^\s*$/.test(suffix)) { // suffix required, but not provided
                client.say(nick, pm.commands[command].help);
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

client.addListener("error", (message) => {
    console.log("error: ", message);
});
