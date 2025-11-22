import { EmbedBuilder, Message, TextChannel } from 'discord.js';
import { Listener } from '../structure/Listener';
import { GuildModel, getLevel, getXP } from '../schemas/Guild';
import { UserModel } from '../schemas/User';
import { EmbedColor } from '../structure/EmbedColor';

module.exports = {
	async execute(message: Message) {
		if (message.author.bot) return;

		const bonus = Math.round(Math.random() * 20 + 10);
		const [mentioned, dbGuild] = await Promise.all([
			UserModel.find({ _id: { $in: Array.from(message.mentions.members.keys()) } }),
			GuildModel.findOneAndUpdate(
				{ _id: message.guild.id, plugins: 'Leveling' },
				{ $inc: { [`xp.${message.author.id}`]: bonus } },
				{ new: true }
			)
		]);

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

		if (!dbGuild) return;

		const xp = dbGuild.xp.get(message.author.id);

		if (xp < getXP(getLevel(xp - bonus) + 1)) return;

		dbGuild.leveling_rewards.forEach(reward => {
			if (getLevel(xp) >= reward.level)
				message.member.roles.add(reward.role).catch(() => {});
		});

		await message.guild.channels
			.fetch(dbGuild.leveling_message?.channel)
			.then((channel: TextChannel) =>
				channel.send(dbGuild.leveling_message.content
					.replaceAll('{user}', message.author.toString())
					.replaceAll('{level}', getLevel(xp).toLocaleString())))
			.catch(() => {});
	}
} satisfies Listener;