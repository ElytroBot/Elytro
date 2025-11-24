import { GuildMember, TextChannel } from 'discord.js';
import { Listener } from '../structure/Listener';
import { GuildModel } from '../schemas/Guild';

module.exports = {
	async execute(member: GuildMember) {
		const dbGuild = await GuildModel.findOne({
			_id: member.guild.id,
			plugins: 'Saluter',
			leave_message: { $exists: true, $ne: null }
		});

		if (!dbGuild) return;

		await member.guild.channels
			.fetch(dbGuild.leave_message.channel)
			.then((channel: TextChannel) =>
				channel.send(dbGuild.leave_message.content
					.replaceAll('{user}', member.toString())
					.replaceAll('{server}', member.guild.name)))
			.catch(() => {});
	}
} satisfies Listener;