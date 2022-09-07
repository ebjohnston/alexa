// public message handler
const greetings = require(__dirname + '/greetings.js')
const main = require(__dirname + '/main.js')
const profiles = require(__dirname + '/profiles.json')
const settings = require(__dirname + '/settings.json')

const commands = {
  'bottle': {
    'name': 'bottle',
    'help': 'usage: ' + settings.prefix + 'bottle -- selects a random user from the channel. Now kiss~',
    'admin': false,
    'suffix': false,
    'process': async (client, channel, nick, suffix) => {
      let enabledProfiles = []
      for (const profile of Object.keys(profiles)) {
        if ('bottle' in profiles[profile] && profiles[profile]['bottle']['enable']) {
          enabledProfiles.push(profile)
        }
      }
      // console.debug("enabled profiles are: " + JSON.stringify(enabledProfiles))
      const activeNicks = Object.keys(main.nickCache[channel])
      // console.debug("active nicks are: " + JSON.stringify(activeNicks))
      let activeEnabledNicks = activeNicks.filter(value => enabledProfiles.includes(value.toLowerCase()))
      
      // console.debug("active enabled nicks are: " + JSON.stringify(activeEnabledNicks))
      let selectedNick, isInactive
      do {
        isInactive = null
        let profileIndex = Math.floor(Math.random() * activeEnabledNicks.length)
        selectedNick = activeEnabledNicks[profileIndex]

        client.whois(selectedNick, (info) => {
          isInactive = 'away' in info
        })

        while (isInactive === null) {
          await new Promise(r => setTimeout(r, 200))
        }
        if (isInactive) {
          activeEnabledNicks = activeEnabledNicks.filter(value => !(value === selectedNick))
        }
      } while ((selectedNick === nick && activeEnabledNicks.length > 1) || isInactive)
      
      client.say(channel, "Okay, " + nick + ", let's spin the bottle! Round and round and round it goes! And it lands on... " +
                        selectedNick + "!")
    }
  },
  'help': {
    'name': 'help',
    'help': '... this is the command you are using right now.',
    'admin': false,
    'suffix': false,
    'process': (client, channel, nick, suffix) => {
      if (/^\s*$/.test(suffix)) { // check if suffix is all whitespace or empty
        let list = ''
        for (let command in commands) {
          if (!commands[command]['admin']) {
            list += settings.prefix + commands[command]['name'] + ' '
          }
        }

        client.say(channel, 'Hello! My name is ' + settings.username + ' and I am a greeting bot. ' +
                          'Most of my commands are available through private messages. ' +
                          '/msg ' + settings.username + ' !help for more information. ' +
                          'If you would like to know more about a particular channel command, just type ' + settings.prefix +
                          'help [command]. The list of available channel commands are: ' + list)

        if (settings.admins.includes(nick)) {
          list = ''
          for (let command in commands) {
            if (commands[command]['admin']) {
              list += settings.prefix + commands[command]['name'] + ' '
            }
          }

          client.say(nick, 'The list of available admin channel commands are: ' + list)
        }
      } else if (commands[suffix]) {
        if (commands[suffix]['admin'] && settings.admins.includes(nick)) {
          client.say(nick, '[admin] ' + commands[suffix]['help'])
        } else {
          client.say(channel, commands[suffix]['help'])
        }
      } else {
        client.say(nick, 'Command not recognized. Try using ' + settings.prefix + 'help without an operand in a public channel.')
      }
    }
  },
  'ping': {
    'name': 'ping',
    'help': 'usage: ' + settings.prefix + 'ping -- returns pong, used to check if the bot is responsive.',
    'admin': true,
    'suffix': false,
    'process': (client, channel, nick, suffix) => {
      client.say(channel, 'pong, ' + nick + "!")
    }
  },
  'roll': {
    'name': 'roll',
    'help': 'usage: ' + settings.prefix + 'roll -- rolls dice. Requires (x)dy format, where x and y are numbers (within limits).',
    'admin': false,
    'suffix': true,
    'process': (client, channel, nick, suffix) => {
      const diceLimit = 30
      const sideLimit = 100

      if (/^[dD]\d+$/.test(suffix)) { // make sure it matches dy syntax
        const sideCount = suffix.substring(suffix.search(/[dD]/) + 1)

        if (sideCount > sideLimit) {
          client.say(channel, "That die has too many sides!")
        } else {
          result = Math.ceil(Math.random() * sideCount)
          client.say(channel, nick + " rolls a " + suffix + " and gets... " + result + "!")
        }
      } else if (/^\d+[dD]\d+$/.test(suffix)) { // make sure it matches xdy syntax
        const diceCount = suffix.substring(0, suffix.search(/[dD]/))
        const sideCount = suffix.substring(suffix.search(/[dD]/) + 1)

        if (diceCount > diceLimit && sideCount > sideLimit) {
          client.say(channel, 'no.')
        } else if (diceCount > diceLimit) {
          client.say(channel, "I can't hold that many dice!")
        } else if (sideCount > sideLimit) {
          client.say(channel, "Those dice have too many sides!")
        } else {
          let sum = 0
          let rolls = []
          for (let index = 0; index < diceCount; index++) {
            newRoll = Math.ceil(Math.random() * sideCount)
            sum += newRoll
            rolls.push(newRoll)
          }
          client.say(channel, nick + " rolls " + suffix + " and gets... " + sum + "! " + JSON.stringify(rolls))
        }
      } else {
        client.say(channel, commands['roll']['help'])
      }
    }
  },
  'who': {
    'name': 'who',
    'help': 'usage: ' + settings.prefix + 'who [nick] -- displays information about a nickname if found in my database.',
    'admin': true,
    'suffix': true,
    'process': (client, channel, nick, suffix) => {
      key = suffix.toLowerCase()

      if (profiles[key]) {
        greetings.introduce(client, channel, suffix)
      } else {
        client.say(channel, "Sorry, I don't recognize the name " + suffix + '.')
      }
    }
  }
}

exports.commands = commands