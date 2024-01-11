<h1 align="center">Docbot</h1>
<p align="center">
Collaborate on message in Discord
</p>

## Commands
#### /DocBot (slash command)
Bot sends message in the channel
#### Edit (message command)
Displays message editing dialog. Right click on message to use.

## How to deploy
1. Create discord bot
2. Create ".dev.vars" file in root with folowing variables:
```
DISCORD_APPLICATION_ID: <your app id>
DISCORD_PUBLIC_KEY: <your app key>
DISCORD_TOKEN: <your app token>
```
3. Run ``npx tsx src/register.ts`` in terminal
4. Create Cloudlfare worker
5. Deploy app to worker (using web interface or ``npx wrangler deploy``)
6. Set workers url in bots Interactions Endpoint URL
7. Generate url with scopes ``bot``,``applications.commands`` and bot permissions ``Send Messages``, ``Use Slash Commands``
