/* eslint-disable @typescript-eslint/no-var-requires */
import { Client, GatewayIntentBits, REST } from 'discord.js';
import { config } from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { Command } from './structure/Command';
import mongoose from 'mongoose';

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
fs.readdirSync(path.join(__dirname, 'commands')).forEach(folder => {
	const folderPath = path.join(path.join(__dirname, 'commands'), folder);

	fs.readdirSync(folderPath).forEach(file => {
		const command = require(path.join(folderPath, file));
		client.commands.push(command);
	});
});

// Loads the events
fs.readdirSync(path.join(__dirname, 'events')).forEach(file => {
	const event = require(path.join(path.join(__dirname, 'events'), file));

	if (event.once) client.once(file.split(/\./g)[0], event.execute);
	else client.on(file.split(/\./g)[0], event.execute);
});

// Starts the bot and REST client
client.login(process.env.TOKEN);
client.rest.setToken(process.env.TOKEN);

// Connects to the database
mongoose
	.connect(process.env.CONNECTION_STRING)
	.then(() => console.log(`[${new Date().toISOString()}] Established connection with MongoDB`));
