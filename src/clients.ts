import { Client, GatewayIntentBits } from 'discord.js';
import { Command } from './structure/Command';
import OpenAI from 'openai';

declare module 'discord.js' {
	interface Client {
		commands: Command[];
	}
}

// Initializes the Discord client
export const client = new Client({
	intents: GatewayIntentBits.GuildMembers
		| GatewayIntentBits.GuildPresences
		| GatewayIntentBits.Guilds
		| GatewayIntentBits.GuildMessageReactions
		| GatewayIntentBits.MessageContent
		| GatewayIntentBits.GuildMessages
});

// Initializes the OpenAI client
export const openai = new OpenAI({
	apiKey: process.env.GROQ_API_KEY,
	baseURL: 'https://api.groq.com/openai/v1'
});