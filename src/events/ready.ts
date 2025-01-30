import { ActivityType, Client, Routes } from 'discord.js';
import { Listener } from '../structure/Listener';
import fs from 'fs';
import path from 'path';

module.exports = {
	once: true,

	async execute(client: Client) {
		if (process.env.NODE_ENV == 'production') {
			const commands = [];

			fs.readdirSync(path.join(__dirname, '..', 'commands', 'global'))
				.forEach(async file =>
					commands.push(
						(await import(path.join(__dirname, '..', 'commands', 'global', file))).data
					)
				);

			// Registers the global commands
			client.rest.put(
				Routes.applicationCommands(client.application!.id), { body: commands }
			);
		}

		// Function to update client's activity
		const updateActivity = () => {
			client.user.setActivity(
				`${client.guilds.cache.size} servers`, { type: ActivityType.Watching }
			);
		};

		// Update activity on startup
		updateActivity();

		// Update activity when bot joins or leaves a guild
		client.on('guildCreate', updateActivity);
		client.on('guildDelete', updateActivity);

		console.log(`[${new Date().toISOString()}] Bot logged in`);
	}
} satisfies Listener;