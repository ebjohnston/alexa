// IRC bot framework

var irc = require("irc");

var greetings = require("./greetings.js");
var pm = require("./pm.js");

var settings = require("./settings.json");
var profiles = require("./profiles.json");

var client = new irc.Client(settings.network, settings.username, settings.parameters);
var duplicates = {};

client.addListener("registered", () => {
    setInterval( () => {
        console.log("resetting duplicates...");

        var now = Date.now();

        for (nick in duplicates) {
            var then = duplicates[nick]["time"];
            var hours = (now - then) / (60 * 60 * 1000);

            if (hours >= settings.cooldown) {
                delete duplicates[nick];
            }
        }
    }, 05 * 60 * 1000);
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

    if (!duplicates[nick] && regex.test(quitMessage)) {
        sleep(10 * 1000);
    }
});

client.addListener("error", (message) => {
    console.log("error: ", message);
});

function processNick(channel, nick, notifyFlag) {
    if (!duplicates[nick] && profiles[nick]) {
        greetings.introduce(client, channel, nick);
        addDuplicate(nick);
    }
    else if (notifyFlag && !profiles[nick]) {
        greetings.notify(client, nick);
    }
}

function addDuplicate(nick) {
    duplicates[nick] = {
        "time": Date.now()
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
