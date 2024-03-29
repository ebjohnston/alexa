const irc = require('irc')

const greetings = require(__dirname + '/greetings.js')
const pm = require(__dirname + '/pm.js')
const public = require(__dirname + '/public.js')

const settings = require(__dirname + '/settings.json')
const profiles = require(__dirname + '/profiles.json')

const client = new irc.Client(settings.network, settings.username, settings.parameters)

let duplicates = {}
let nickCache = {}

client.addListener('registered', () => {
  setInterval(() => {
    let now = Date.now()

    for (let channel in duplicates) {
      for (let nick in duplicates[channel]) {
        let then = duplicates[channel][nick]['time']
        let hours = (now - then) / (60 * 60 * 1000)

        if (hours >= settings.cooldown) {
          delete duplicates[channel][nick]
        }
      }
    }
  }, 5 * 60 * 1000)
})

// pm command parser
client.addListener('pm', (nick, text, message) => {
  if (!text.startsWith(settings.prefix)) {
    client.say(nick, "I don't recognize this syntax. Type " + settings.prefix + 'help for more information.')
  } else {
    let command = text.substring(settings.prefix.length).split(' ')[0]
    let suffix = text.substring(settings.prefix.length + command.length + 1)

    if (pm.commands[command]) {
      if (pm.commands[command]['admin'] && !settings.admins.includes(nick)) {
        client.say(nick, 'You do not have permission to use that command.')
      } else if (pm.commands[command]['suffix'] && /^\s*$/.test(suffix)) {
        // check if suffix is required and not provided
        client.say(nick, pm.commands[command]['help'])
      } else {
        pm.commands[command].process(client, nick, suffix)
      }
    } else {
      client.say(nick, "I don't recognize this command. Type " + settings.prefix + 'help for more information.')
    }
  }
})


client.addListener('message#', (nick, channel, text, message) => {
  if (text.startsWith(settings.prefix)) {
    let command = text.substring(settings.prefix.length).split(' ')[0]
    let suffix = text.substring(settings.prefix.length + command.length + 1)

    if (public.commands[command]) {
      if (public.commands[command]['admin'] && !settings.admins.includes(nick)) {
        client.say(nick, 'You do not have permission to use ' + settings.prefix + channel + 'in public channels.')
      } else if (public.commands[command]['suffix'] && /^\s*$/.test(suffix)) {
        // check if suffix is required and not provided
        client.say(nick, public.commands[command]['help'])
      } else {
        public.commands[command].process(client, channel, nick, suffix)
      }
    } else {
      client.say(nick, "I don't recognize " + settings.prefix + command + ". Type " + settings.prefix + 'help in the channel for more information.')
    }
  }

  if (text.startsWith(settings.username + ', who is ') &&
        text.charAt(text.length - 1) === '?' &&
        settings.admins.includes(nick)) {
    let query = text.substring(settings.username.length + 9, text.length - 1)
    let key = query.toLowerCase()

    if (profiles[key]) {
      greetings.introduce(client, channel, query)
    } else {
      client.say(channel, "Sorry, I don't recognize the name " + query + '.')
    }
  }
})

client.addListener('join', (channel, nick, message) => {
  processNick(channel, nick, true)
})

client.addListener('nick', (oldNick, newNick, channels, message) => {
  for (let channel in channels) {
    processNick(channels[channel], newNick, false)
  }
})

// handles netsplits
client.addListener('quit', (nick, reason, channels, message) => {
  let netName = settings.network.split('.')[1]
  let quitMessage = message.args[0]
  let regex = new RegExp(netName + '[\\d\\D]+' + netName)

  if (regex.test(quitMessage)) {
    addDuplicate(nick.toLowerCase())
    sleep(settings.netsplit * 1000)
  }
})

client.addListener('error', (message) => {
  console.log('error: ', message)
})

client.addListener('names', (channel, nicks) => {
  nickCache[channel] = nicks
})

function processNick (channel, nick, notifyFlag) {
  let key = nick.toLowerCase() // ensure homogenous keys

  if (!duplicates[channel]) {
    duplicates[channel] = {}
  }
  if (!duplicates[channel][key] && profiles[key]) {
    greetings.introduce(client, channel, nick)
    addDuplicate(channel, key)
  } else if (notifyFlag && !profiles[key]) {
    greetings.notify(client, nick)
  }
}

function addDuplicate (channel, nick) {
  duplicates[channel][nick] = {
    'time': Date.now()
  }
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.nickCache = nickCache