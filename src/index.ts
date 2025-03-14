import { Client, GatewayIntentBits, REST } from 'discord.js';
import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { Command } from './structure/Command';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';

// Catches any uncaught exceptions
process.on('uncaughtException',
	e => console.error(`[${new Date().toISOString()}] ${e.stack}`));

config(); // Configures the dotenv module to be able to use environment variables

// Merges a Client interface with the Client class
declare module 'discord.js' {
	interface Client {
		commands: Command[];
	}
}

// Creates the Discord client
const client = new Client({
	intents: GatewayIntentBits.GuildMembers |
		GatewayIntentBits.GuildPresences |
		GatewayIntentBits.Guilds |
		GatewayIntentBits.GuildMessageReactions |
		GatewayIntentBits.MessageContent |
		GatewayIntentBits.GuildMessages
});
client.rest = new REST(); // Creates a REST client
client.commands = []; // Initializes the client's commands

// Loads the commands
for (const folder of fs.readdirSync(path.resolve('src', 'commands'))) {
	const folderPath = path.resolve('src', 'commands', folder);

	for (const file of fs.readdirSync(folderPath)) {
		client.commands.push((await import(pathToFileURL(path.join(folderPath, file)).href)).default);
	}
}

// Loads the events
for (const file of fs.readdirSync(path.resolve('src', 'events'))) {
	const event = await import(pathToFileURL(path.join('src', 'events', file)).href);

	if (event.default.once) client.once(file.split(/\./g)[0], event.default.execute);
	else client.on(file.split(/\./g)[0], event.default.execute);
}

// Starts the bot and REST client
client.login(process.env.TOKEN);
client.rest.setToken(process.env.TOKEN);

// Connects to the database
mongoose
	.connect(process.env.CONNECTION_STRING)
	.then(() => console.log(`[${new Date().toISOString()}] Established connection with MongoDB`));