import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { Listener } from '../structure/Listener';
import { GuildModel, getLevel, getXP } from '../schemas/Guild';
import { UserModel } from '../schemas/User';
import { EmbedColor } from '../structure/EmbedColor';

module.exports = {
	async execute(message: Message) {
		if (message.author.bot) return;

		const mentioned = await UserModel
			.find({ _id: { $in: Array.from(message.mentions.members.keys()) } });

		for (const mention of mentioned) {
			if (mention.afk_status) {
				message.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'This user is afk.',
							fields: [
								{ name: 'Reason', value: mention.afk_status }
							]
						})
					]
				});
			}
		}

		const guild = await GuildModel.findById(message.guild.id);
		
		if (!guild?.plugins.includes('Leveling')) return;

		const xp = guild.xp.get(message.author.id) as number ?? 0;
		const bonus = Math.round(Math.random() * 20 + 10);

		if (xp + bonus >= getXP(getLevel(xp) + 1)) {
			guild.leveling_rewards?.forEach(async reward => {
				if (getLevel(xp + bonus) >= reward.level)
					message.member.roles.add(await message.guild.roles.fetch(reward.role))
						.catch(() => {});
			});

			if (!guild.leveling_message?.channel) return;

			await message.guild.channels
				.fetch(guild.leveling_message.channel)
				.then((channel: TextChannel) =>
					channel.send(guild.leveling_message.content
						.replaceAll('{user}', message.author.toString())
						.replaceAll('{level}', getLevel(xp + bonus).toLocaleString())))
				.catch(() => {});
		}

		guild.xp.set(message.author.id, xp + bonus);
		guild.save();
	}
} satisfies Listener;