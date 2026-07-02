import { ActivityType, Client } from 'discord.js';
import { Listener } from '../structure/Listener';
import fs from 'fs';
import path from 'path';
import { ReminderModel } from '../schemas/Reminder';
import { schedule } from '../commands/global/reminders';
import { client } from '../clients';

module.exports = {
	once: true,

	async execute(client: Client) {
		if (process.env.NODE_ENV == 'production') {
			// Registers the global commands
			await client.application?.commands.set(
				await Promise.all(
					fs
						.readdirSync(path.resolve('src', 'commands', 'global'))
						.map(async file => (await import(`../commands/global/${file}`)).default.data)
				)
			);
		}

		// Starts the reminders
		await ReminderModel
			.find({})
			.then(reminders => reminders.forEach(r => schedule(r)));

		// Update activity on startup
		updateActivity();

		// Update activity when bot joins or leaves a guild
		client.on('guildCreate', () => updateActivity());
		client.on('guildDelete', () => updateActivity());

		console.log(`[${new Date().toISOString()}] Bot logged in`);
	}
} satisfies Listener;

function updateActivity() {
	client.user!.setActivity(
		`${client.guilds.cache.size} servers`,
		{ type: ActivityType.Watching }
	);
}