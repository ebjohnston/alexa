import { Client } from 'irc'

import { introduce, notify } from './greetings.js'
import { commands as pmCommands } from './pm.js'
import { commands as channelCommands } from './public.js'

import settings from './settings.json' with { type: 'json' }
import profiles from './profiles.json' with { type: 'json' }

const client = new Client(settings.network, settings.username, settings.parameters)

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
  console.log(`User ${nick} has sent PM: ${text}`)
  if (!text.startsWith(settings.prefix)) {
    client.say(nick, "I don't recognize this syntax. Type " + settings.prefix + 'help for more information.')
  } else {
    let command = text.substring(settings.prefix.length).split(' ')[0]
    let suffix = text.substring(settings.prefix.length + command.length + 1)

    if (pmCommands[command]) {
      if (pmCommands[command]['admin'] && !settings.admins.includes(nick)) {
        client.say(nick, 'You do not have permission to use that command.')
      } else if (pmCommands[command]['suffix'] && /^\s*$/.test(suffix)) {
        // check if suffix is required and not provided
        client.say(nick, pmCommands[command]['help'])
      } else {
        pmCommands[command].process(client, nick, suffix)
      }
    } else {
      client.say(nick, "I don't recognize this command. Type " + settings.prefix + 'help for more information.')
    }
  }
})


client.addListener('message#', (nick, channel, text, message) => {
    console.log(`User ${nick} has sent channel ${channel} message: ${text}`)
  if (text.startsWith(settings.prefix)) {
    let command = text.substring(settings.prefix.length).split(' ')[0]
    let suffix = text.substring(settings.prefix.length + command.length + 1)

    if (channelCommands[command]) {
      if (channelCommands[command]['admin'] && !settings.admins.includes(nick)) {
        client.say(nick, 'You do not have permission to use ' + settings.prefix + channel + 'in public channels.')
      } else if (channelCommands[command]['suffix'] && /^\s*$/.test(suffix)) {
        // check if suffix is required and not provided
        client.say(nick, channelCommands[command]['help'])
      } else {
        channelCommands[command].process(client, channel, nick, suffix)
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
      introduce(client, channel, query)
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

function processNick (channel, nick, isNotifyEnabled) {
  let key = nick.toLowerCase() // ensure homogenous keys

  if (!duplicates[channel]) {
    duplicates[channel] = {}
  }
  if (!duplicates[channel][key] && profiles[key]) {
    introduce(client, channel, nick)
    addDuplicate(channel, key)
  } else if (isNotifyEnabled && !profiles[key]) {
    notify(client, nick)
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

export { nickCache }
