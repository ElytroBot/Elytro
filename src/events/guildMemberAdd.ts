import { GuildMember, TextChannel } from 'discord.js';
import { Listener } from '../structure/Listener';
import { GuildModel } from '../schemas/Guild';

module.exports = {
	async execute(member: GuildMember) {
		const guild = await GuildModel.findById(member.guild.id);

		if (!guild?.plugins.includes('Saluter') || !guild.join_message) return;

		member.guild.channels
			.fetch(guild.join_message.channel)
			.then((channel: TextChannel) =>
				channel.send(guild.join_message.content
					.replaceAll('{user}', member.toString())
					.replaceAll('{server}', member.guild.name)))
			.catch(() => {});
	}
} satisfies Listener;