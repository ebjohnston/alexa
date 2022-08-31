// private message handler
const fs = require('fs')

const greetings = require(__dirname + '/greetings.js')
const main = require(__dirname + '/main.js')

const PROFILES_DIRECTORY = __dirname + '/profiles.json'
const profiles = require(PROFILES_DIRECTORY)
const settings = require(__dirname + '/settings.json')

const commands = {
  'backup': {
    'name': 'backup',
    'help': 'admin command used to store profiles to backup file',
    'admin': true,
    'suffix': false,
    'process': (client, nick, suffix) => {
      fs.writeFile(__dirname + '/profiles-backup.json', JSON.stringify(profiles), (err) => {
        if (err) {
          console.log(err)
        } else {
          console.log('backing up profiles on command...')
          client.say(nick, 'Profiles backed up successfully.')
        }
      })
    }
  },
  'bottle': {
    'name': 'bottle',
    'help': 'usage: ' + settings.prefix + 'bottle [on | off | status | list] -- ' +
                'this determines whether your name is included in the pool for the channel command !bottle. ' +
                'Status shows whether the flag is enabled, and list shows the current list of eligible nicks in all channels. ' +
                'By default, this flag is enabled.',
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      let key = nick.toLowerCase()

      if (!profiles[key]) {
        client.say(nick, 'You do not yet have a profile configured. Please add a profile before modifying the bottle flag. ' +
                           'See ' + settings.prefix + 'help for more information.')
      } else if (suffix === 'on') {
        profiles[key]['bottle']['enable'] = true
        client.say(nick, 'The bottle flag for ' + nick + ' has been enabled.')
      } else if (suffix === 'off') {
        profiles[key]['bottle']['enable'] = false
        client.say(nick, 'The bottle flag for ' + nick + ' has been disabled.')
      } else if (suffix === 'status') {
        if (profiles[key]['bottle']['enable']) {
          client.say(nick, 'The bottle flag for ' + nick + ' is currently enabled.')
        } else {
          client.say(nick, 'The bottle flag for ' + nick + ' is currently disabled.')
        }
      } else if (suffix == 'list') {
        let enabledProfiles = []
        for (const profile of Object.keys(profiles)) {
          if ('bottle' in profiles[profile] && profiles[profile]['bottle']['enable']) {
            enabledProfiles.push(profile)
          }
        }
        for (let channel of settings.parameters.channels) {
          const activeNicks = Object.keys(main.nickCache[channel])
          const activeEnabledNicks = activeNicks.filter(value => enabledProfiles.includes(value.toLowerCase()))
          client.say(nick, "The nicks available for !bottle in " + channel + " are: " + JSON.stringify(activeEnabledNicks))
        }
      }else {
        client.say(nick, 'parameter not recognized. ' + commands['counter'].help)
      }
      writeProfiles(nick)
    }
  },
  'counter': {
    'name': 'counter',
    'help': 'usage: ' + settings.prefix + 'counter [on | off | show | reset] -- ' +
                'this counts the number of times other users have searched for this nick via !who. ' +
                'on and off enable and disable this counter respectively (disabling also resets the count); ' +
                'show displays the current count; reset resets the current count to zero. ' +
                'By default, this counter is enabled.',
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      let key = nick.toLowerCase()

      if (!profiles[key]) {
        client.say(nick, 'You do not yet have a profile configured. Please add a profile before modifying the counter. ' +
                           'See ' + settings.prefix + 'help for more information.')
      } else if (suffix === 'on') {
        profiles[key]['counter']['enable'] = true
        client.say(nick, 'The counter for ' + nick + ' has been enabled.')
      } else if (suffix === 'off') {
        profiles[key]['counter']['enable'] = false
        profiles[key]['counter']['count'] = 0
        client.say(nick, 'The counter for ' + nick + ' has been disabled and reset.')
      } else if (suffix === 'reset') {
        profiles[key]['counter']['count'] = 0
        client.say(nick, 'The counter for ' + nick + ' has been reset to zero.')
      } else if (suffix === 'show') {
        client.say(nick, 'The current counter value for ' + nick + ' is: ' + profiles[key]['counter']['count'])
      } else {
        client.say(nick, 'parameter not recognized. ' + commands['counter'].help)
      }
      writeProfiles(nick)
    }
  },
  'del': {
    'name': 'del',
    'help': 'usage: ' + settings.prefix + 'del [description, image, link, all] -- ' +
                'removes one or all of your profile elements from my database.',
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      let key = nick.toLowerCase()

      if (suffix === 'all') {
        delete profiles[key]
        client.say(nick, 'your profile has been successfully cleared.')
      } else if (suffix === 'description' || suffix === 'image' || suffix === 'link') {
        delete profiles[key][suffix]
        client.say(nick, "your profile's " + suffix + ' has been successfully removed.')

        if (!profiles[key]['description'] && !profiles[key]['image'] && !profiles[key]['link']) {
          delete profiles[key]
          client.say(nick, 'No remaining profile attributes. Your profile has been cleared and reset.')
        }
      } else {
        client.say(nick, 'parameter not recognized. ' + commands['del'].help)
      }

      writeProfiles(nick)
    }
  },
  'desc': {
    'name': 'desc',
    'help': 'usage: ' + settings.prefix + 'desc [text] -- sets a quick description for your nick (max 200 characters). ' +
                "Do not surround the description in quotes; do not start with a verb (e.g. 'a red fox' rather than 'is a red fox').",
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      addProfileInfo(client, nick, suffix, 'description', 200)
    }
  },
  'echo': {
    'name': 'echo',
    'help': 'usage: ' + settings.prefix + 'echo [text] -- echos text as the bot into all channels. ' +
                'alternative usage: ' + settings.prefix + 'echo /me [text] -- echos text as an action instead.',
    'admin': true,
    'suffix': true,
    'process': (client, nick, suffix) => {
      for (let channel in settings.parameters.channels) {
        if (suffix.startsWith('/me ')) {
          client.action(settings.parameters.channels[channel], suffix.substring(4))
        } else {
          client.say(settings.parameters.channels[channel], suffix)
        }
      }
    }
  },
  'img': {
    'name': 'img',
    'help': 'usage: ' + settings.prefix + 'img [url] -- sets a link to an image reference for your character (max 50 characters). ' +
                "Make sure you include the full URL starting with 'http' and link directly to the image.",
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      addProfileInfo(client, nick, suffix, 'image', 50)
    }
  },
  'help': {
    'name': 'help',
    'help': '... this is the command you are using right now.',
    'admin': false,
    'suffix': false,
    'process': (client, nick, suffix) => {
      if (/^\s*$/.test(suffix)) { // check if suffix is all whitespace or empty
        client.say(nick, 'Hello! My name is ' + settings.username + ' and I am a greeting bot. ' +
                                 "If you would like to add your nickname's description to my database, " +
                                 'you can do so with the commands ' + settings.prefix + 'desc (to set a ' +
                                 'quick text description), ' + settings.prefix + 'img (to link to an ' +
                                 'image reference), or ' + settings.prefix + 'link (to link to an extended profile).')

        let list = ''
        for (let command in commands) {
          if (!commands[command]['admin']) {
            list += settings.prefix + commands[command]['name'] + ' '
          }
        }

        client.say(nick, 'If you would like to know more about a particular command, just type ' + settings.prefix +
                                 'help [command]. The list of available commands are: ' + list)

        if (settings.admins.includes(nick)) {
          list = ''
          for (let command in commands) {
            if (commands[command]['admin']) {
              list += settings.prefix + commands[command]['name'] + ' '
            }
          }

          client.say(nick, 'The list of available admin commands are: ' + list)
        }
      } else if (commands[suffix]) {
        if (commands[suffix]['admin']  && settings.admins.includes(nick)) {
          client.say(nick, '[admin] ' + commands[suffix]['help'])
        } else {
          client.say(nick, commands[suffix]['help'])
        }
      } else {
        client.say(nick, 'Command not recognized. Try using ' + settings.prefix + 'help without an operand.')
      }
    }
  },
  'link': {
    'name': 'link',
    'help': 'usage: ' + settings.prefix + 'link [url] -- sets a link to an extended profile for your character (max 50 characters). ' +
                "Make sure you include the full URL starting with 'http' and link directly to the profile.",
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      addProfileInfo(client, nick, suffix, 'link', 50)
    }
  },
  'notify': {
    'name': 'notify',
    'help': 'usage: ' + settings.prefix + 'notify [on | off] -- toggle whether I PM you when someone queries your profile in my database. ' +
                'By default, this is turned off.',
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      let key = nick.toLowerCase()

      if (!profiles[key]) {
        client.say(nick, 'You do not yet have a profile configured. Please add a profile before enabling notifications. See ' +
                           settings.prefix + 'help for more information.')
      } else if (suffix === 'on') {
        profiles[key]['notify'] = true
        client.say(nick, 'Notifications are now enabled for user ' + nick + '.')
      } else if (suffix === 'off') {
        profiles[key]['notify'] = false
        client.say(nick, 'Notifications are now disabled for user ' + nick + '.')
      } else {
        client.say(nick, 'parameter not recognized. ' + commands['notify'].help)
      }

      writeProfiles(nick)
    }
  },
  'ping': {
    'name': 'ping',
    'help': 'usage: ' + settings.prefix + 'ping -- returns pong, used to check if the bot is responsive.',
    'admin': false,
    'suffix': false,
    'process': (client, nick, suffix) => {
      client.say(nick, 'pong')
    }
  },
  'rejoin': {
    'name': 'rejoin',
    'help': 'usage: ' + settings.prefix + 'rejoin -- /joins all channels',
    'admin': true,
    'suffix': false,
    'process': (client, nick, suffix) => {
      for (let channel of settings.parameters.channels) {
        client.say(nick, 'Rejoining channels...')
        client.join(channel)
      }
    }
  },
  'source': {
    'name': 'source',
    'help': 'usage: ' + settings.prefix + 'source -- links to the source code for the bot.',
    'admin': false,
    'suffix': false,
    'process': (client, nick, suffix) => {
      client.say(nick, 'My source code can be found at: https://github.com/ebjohnston/alexa')
    }
  },
  'update': {
    'name': 'update',
    'help': 'usage: ' + settings.prefix + 'update -- updates the profiles to ensure schema compliance.',
    'admin': true,
    'suffix': false,
    'process': (client, nick, suffix) => {
      for (const profile of Object.keys(profiles)) {
        if (!('bottle' in profiles[profile])) {
          profiles[profile]['bottle'] = {
            'enable': true
          }
          client.say(nick, "Updating bottle flag for: " + profile + "...")
        }

        if (!('counter' in profiles[profile])) {
          profiles[profile]['counter'] = {
            'enable': true,
            'count': 0
          }
          client.say(nick, 'Updated count for: ' + profile + "...")
        }

        if (!('notify' in profiles[profile])) {
          profiles[profile]['notify'] = false
          client.say(nick, 'Updated notify for: ' + profile + "...")
        }
      }

      writeProfiles("UPDATE:" + nick)
      client.say(nick, "Profile update complete.")
    }
  },
  'who': {
    'name': 'who',
    'help': 'usage: ' + settings.prefix + 'who [nick] -- displays information about a nickname if found in my database.',
    'admin': false,
    'suffix': true,
    'process': (client, nick, suffix) => {
      // sanitize nick query
      let key = suffix.toLowerCase().split(' ')[0]

      if (profiles[key]) {
        client.say(nick, suffix + ' is:' + greetings.describe(key))

        if (nick.toLowerCase() !== key) {
          if (profiles[key]['notify']) {
            client.say(key, nick + ' has just requested your information via ' + settings.prefix + 'who. ' +
                                   'To disable these notifications, PM me: ' + settings.prefix + 'notify off.')
          }
          if (profiles[key]['counter']['enable']) {
            profiles[key]['counter']['count'] += 1
          }
        }
      } else {
        client.whois(suffix, (info) => {
          if (info.user) { // user is online, but has no profile
            client.say(nick, 'Sorry, this user has not configured a profile.')
          } else {
            client.say(nick, "Sorry, I don't recognize this name.")
          }
        })
      }
    }
  },
  'whois': {
    'name': 'whois',
    'help': 'usage: ' + settings.prefix + 'whois [nick] -- returns WHOIS response, for debugging.',
    'admin': true,
    'suffix': true,
    'process': (client, nick, suffix) => {
      client.whois(suffix, (info) => {
        client.say(nick, JSON.stringify(info))
      })
    }
  }
}

function addProfileInfo (client, nick, suffix, type, max) {
  if (suffix.length > max) {
    client.say(nick, 'Maximum character limit exceeded. Please make sure your ' + type + ' is less than ' + max + ' characters and try again.')
  } else {
    let key = nick.toLowerCase() // ensure homogenous keys

    if (!profiles[key]) {
      profiles[key] = {}
      
      profiles[key]['bottle'] = {
        'enable': true
      }
      profiles[key]['counter'] = {
        'enable': true,
        'count': 0
      }
      profiles[key]['notify'] = false
    }

    profiles[key][type] = suffix

    if (profiles[key][type]) {
      client.say(nick, 'Your ' + type + ' has been successfully updated. Type "!who ' + nick + '" to view your full profile.')
    } else {
      client.say(nick, 'Your ' + type + ' has been successfully added. Type "!who ' + nick + '" to view your full profile.')
    }

    writeProfiles(nick)
  }
}

function writeProfiles (nick) {
  fs.writeFile(PROFILES_DIRECTORY, JSON.stringify(profiles), (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('Writing profiles to ' + PROFILES_DIRECTORY + ' for: ' + nick)
    }
  })
}

exports.commands = commands
