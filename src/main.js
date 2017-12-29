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

// pm command parser
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
    if (text.startsWith(settings.username + ", who is ") &&
        text.charAt(text.length-1) === "?" &&
        settings.admins.includes(nick)) {

        var query = text.substring(settings.username.length + 9, text.length-1);

        if (profiles[query]) {
            greetings.introduce(client, channel, query);
        }
        else {
            client.say(channel, "Sorry, I don't recognize the name " + query + ".");
        }
    }
});

client.addListener("join", (channel, nick, message) => {
    processNick(channel, nick, true);
});

client.addListener("nick", (oldNick, newNick, channels, message) => {
    for (channel in channels) {
        processNick(channels[channel], newNick, false);
    }
});

// handles netsplits
client.addListener("quit", (nick, reason, channels, message) => {
    var netName = settings.network.split(".")[1];
    var quitMessage = message.args[0];
    var regex = new RegExp(netName + "[\\d\\D]+" + netName);

    if (!duplicates.includes(nick) && regex.test(quitMessage)) {
        duplicates.push(nick);
    }
});

client.addListener("error", (message) => {
    console.log("error: ", message);
});

function processNick(channel, nick, notifyFlag) {
    if (!duplicates.includes(nick) && profiles[nick]) {
        greetings.introduce(client, channel, nick);
        duplicates.push(nick);
    }
    else if (notifyFlag) {
        greetings.notify(client, nick);
    }
}
