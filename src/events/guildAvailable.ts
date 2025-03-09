import { Guild, Routes } from 'discord.js';
import { Listener } from '../structure/Listener';
import { GuildModel } from '../schemas/Guild';
import path from 'path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

module.exports = {
	async execute(guild: Guild) {
		if (process.env.NODE_ENV != 'production') return;

		guild.client.rest.put(
			Routes.applicationGuildCommands(process.env.APPLICATION_ID, guild.id),
			{ body: [] }
		);

		const dbGuild = await GuildModel.findById(guild.id);
		if (!dbGuild) return;

		for (const plugin of dbGuild.plugins) {
			const pluginPath = path.resolve('src', 'commands', plugin);
            
			if (!fs.existsSync(pluginPath)) return;

			for (const file of fs.readdirSync(pluginPath)) {
				guild.commands.create(
					(await import(pathToFileURL(path.join(pluginPath, file)).href)).default.data
				);
			}
		}
	}
} satisfies Listener;