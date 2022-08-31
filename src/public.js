// public message handler
const greetings = require(__dirname + '/greetings.js')
const profiles = require(__dirname + '/profiles.json')
const pm = require(__dirname + '/pm.js')
const settings = require(__dirname + '/settings.json')

const commands = {
  'bottle': {
    'name': 'bottle',
    'help': 'usage: ' + settings.prefix + 'bottle -- selects a random user from the channel. Now kiss~',
    'admin': false,
    'suffix': true,
    'process': (client, channel, nick, suffix) => {
      var validProfiles = []
      for (var profile in Object.keys(profiles)) {
        if (profiles[profile]['bottle']['enable']) {
          client.whois(profile, (info) => {
            client.say(nick, info)
          })
        }
      }
      let profileNames = Object.keys(profiles)
      let profileIndex = Math.floor(Math.random() * profileNames.length)
      
      client.say(channel, "Okay, " + nick + ", let's spin the bottle! Round and round and round it goes! And it lands on... " +
                        profileNames[profileIndex] + "!")
    }
  },
  'help': {
    'name': 'help',
    'help': '... this is the command you are using right now.',
    'admin': false,
    'suffix': false,
    'process': (client, channel, nick, suffix) => {
      if (/^\s*$/.test(suffix)) { // check if suffix is all whitespace or empty
        client.say(channel, 'Hello! My name is ' + settings.username + ' and I am a greeting bot. ' +
                          'Most of my commands are available through private messages. ' +
                          '/msg ' + settings.username + '!help for more information. ')

        let list = ''
        for (let command in commands) {
          if (!commands[command]['admin']) {
            list += settings.prefix + commands[command]['name'] + ' '
          }
        }

        client.say(channel, 'If you would like to know more about a particular channel command, just type ' + settings.prefix +
                                 'help [command]. The list of available channel commands are: ' + list)

        if (settings.admins.includes(nick)) {
          list = ''
          for (let command in commands) {
            if (commands[command]['admin']) {
              list += settings.prefix + commands[command]['name'] + ' '
            }
          }

          client.say(channel, 'The list of available admin channel commands are: ' + list)
        }
      } else if (commands[suffix]) {
        if (commands[suffix]['admin']) {
          client.say(channel, '[admin] ' + commands[suffix]['help'])
        } else {
          client.say(channel, commands[suffix]['help'])
        }
      } else {
        client.say(channel, 'Command not recognized. Try using ' + settings.prefix + 'help without an operand.')
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
  'who': {
    'name': 'who',
    'help': 'usage: ' + settings.prefix + 'who [nick] -- displays information about a nickname if found in my database.',
    'admin': true,
    'suffix': true,
    'process': (client, channel, nick, suffix) => {
      greetings.introduce(client, channel, suffix)
    }
  }
}

exports.commands = commands
