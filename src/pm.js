// private message handler

var fs = require("fs");

var greetings = require("./greetings.js");

const PROFILES_DIRECTORY = "./profiles.json";
var profiles = require(PROFILES_DIRECTORY);
var settings = require("./settings.json");

var commands = {
    "desc": {
        "name": "desc",
        "help": "usage " + settings.prefix + "desc [text] -- sets a quick description for your nick (max 200 characters). " +
                "Do not surround the description in quotes; do not start with a verb (e.g. 'a red fox' rather than 'is a red fox').",
        "suffix": true,
        "process": (client, nick, suffix) => {
            updateProfile(client, nick, suffix, "description", 200);
        }
    },
    "img": {
        "name": "img",
        "help": "usage " + settings.prefix + "img [url] -- sets a link to an image reference for your character (max 50 characters). " +
                "Make sure you include the full URL starting with 'http' and link directly to the image.",
        "suffix": true,
        "process": (client, nick, suffix) => {
            updateProfile(client, nick, suffix, "image", 50);
        }
    },
    "help": {
        "name": "help",
        "help": "... this is the command you are using right now",
        "suffix": false,
        "process": (client, nick, suffix) => {
            messageHelp(client, nick, suffix);
        }
    },
    "link": {
        "name": "link",
        "help": "usage " + settings.prefix + "link [url] -- sets a link to an extended profile for your character (max 50 characters). " +
                "Make sure you include the full URL starting with 'http' and link directly to the profile.",
        "suffix": true,
        "process": (client, nick, suffix) => {
            updateProfile(client, nick, suffix, "link", 50);
        }
    },
    "who": {
        "name": "who",
        "help": "usage: " + settings.prefix + "who [nick] -- displays information about a nickname, if found",
        "suffix": true,
        "process": (client, nick, suffix) => {
            if (profiles[suffix]) {
                client.say(nick, suffix + " is:" + greetings.describe(nick));
            }
            else {
                client.say(nick, "Sorry, I don't recognize this name.");
            }
        }
    }
};

function updateProfile(client, nick, suffix, type, max) {
    if (suffix.length > max) {
        client.say(nick, "maximum character limit exceeded. Please make sure your " + type + " is less than " + max + " characters and try again.");
    }
    else {
        if (profiles[nick][type]) {
            client.say(nick, "your " + type + " has been successfully updated. Type !who [your name] to view your full profile.");
        }
        else {
            client.say(nick, "your " + type + " has been successfully added. Type !who [your name] to view your full profile.");
        }

        profiles[nick][type] = suffix;

        fs.writeFile(PROFILES_DIRECTORY, JSON.stringify(profiles), (err) => {
            if (err) {
                console.log(err);
            }
            else {
                console.log(JSON.stringify(profiles));
                console.log('writing to ' + PROFILES_DIRECTORY);
            }
        });
    }
}

function messageHelp(client, nick, suffix) {
    if (/^\s*$/.test(suffix)) { // check if all whitespace or empty
        client.say(nick, "Hello! My name is " + settings.username + " and I am a greeting bot. " +
                         "If you would like to add your character's description to my database, " +
                         "you can do so with the commands " + settings.prefix + "desc (to set a quick text description), " +
                         settings.prefix + "img (to link to an image reference), or " + settings.prefix +
                         "link (to link to an extended character profile).");

        var list = "";
        for (command in commands) {
            list += commands[command]["name"] + " ";
        }

        client.say(nick, "If you would like to know more about a particular command, just type " + settings.prefix +
                         "help [command]. The list of available commands are: " + list);
    }
    else if (commands[suffix]) {
        client.say(nick, commands[suffix]["help"]);
    }
    else {
        client.say(nick, "Command not recognized. Try using " + settings.prefix + "help without an operand.");
    }
}

exports.commands = commands;
