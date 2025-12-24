import { Guild } from 'discord.js';
import { Listener } from '../structure/Listener';
import { GuildModel } from '../schemas/Guild';
import path from 'path';
import fs from 'node:fs';

module.exports = {
	async execute(guild: Guild) {
		if (process.env.NODE_ENV != 'production') return;

		const dbGuild = await GuildModel.findById(guild.id);

		await guild.commands.set(
			await Promise.all(
				dbGuild?.plugins
					.map(plugin => {
						const pluginPath = path.resolve('src', 'commands', plugin);

						if (!fs.existsSync(pluginPath)) return [];

						return fs
							.readdirSync(pluginPath)
							.map(async file => (await import(`../commands/${plugin}/${file}`)).default.data);
					})
					.flat() ?? []
			)
		);
	}
} satisfies Listener;