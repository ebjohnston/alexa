# Alexa
IRC greeting bot created in Node.js

## Installation
1. Clone this repo
    ```
    git clone https://github.com/XavierRaine/alexa.git
    ```

1. Install node project manager dependencies [Note: requires NPM to be installed already]
    ```
    cd alexa
    npm install
    ```

1. Configure `settings.json` in the src directory. See `settings.json.example` for a template.

1. Create a new `profiles.json` containing `{}` in the src directory. Optionally, you can load another `profiles.json` file from a previous instance of this bot.

1. Start the bot by navigating to core directory and initializing core.js
    ```
    cd src
    node main.js
    ```

## Settings Configuration
The settings file has the following required parameters:

| name       | meaning                                                     | example             |
| ---------- | ----------------------------------------------------------- | ------------------- |
| network    | the URL of the IRC network for the bot                      | irc.yournetwork.com |
| username   | the nickname for the bot                                    | myNick              |
| parameters | array containing `channels` and `password`                  | [see example]       |
| channels   | array of channels for the bot to autojoin on startup        | [#channel]          |
| password   | the password associated with the `username` for the bot     | myPass              |
| prefix     | prefix for all PM commands                                  | !                   |
| cooldown   | the minimum number of hours between duplicate introductions | 6                   |
