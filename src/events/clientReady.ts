import { ActivityType, Client } from 'discord.js';
import { Listener } from '../structure/Listener';
import fs from 'fs';
import path from 'path';

module.exports = {
	once: true,

	async execute(client: Client) {
		if (process.env.NODE_ENV == 'production') {
			// Registers the global commands
			await client.application.commands.set(
				await Promise.all(
					fs
						.readdirSync(path.resolve('src', 'commands', 'global'))
						.map(async file => (await import(`../commands/global/${file}`)).default.data)
				)
			);
		}

		// Update activity on startup
		updateActivity(client);

		// Update activity when bot joins or leaves a guild
		client.on('guildCreate', () => updateActivity(client));
		client.on('guildDelete', () => updateActivity(client));

		console.log(`[${new Date().toISOString()}] Bot logged in`);
	}
} satisfies Listener;

function updateActivity(client: Client) {
	client.user.setActivity(
		`${client.guilds.cache.size} servers`,
		{ type: ActivityType.Watching }
	);
}