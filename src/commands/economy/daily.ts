import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { Embed, EmbedColor } from '../../structure/Embed';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('daily')
		.setDescription('Redeems your daily coins.'),

	async onCommandInteraction(interaction) {
		const user = await UserModel.findById(interaction.user.id) ??
			await UserModel.create({ _id: interaction.user.id });
		const now = Math.floor(Date.now() / 1000);

		if (user.cooldowns.get('daily') > now) {
			interaction.reply({
				embeds: [
					new Embed({
						color: EmbedColor.danger,
						description: `You have already claimed today's coins! Come back <t:${user.cooldowns.get('daily')}:R>`,
					}),
				],
				ephemeral: true,
			});
			return;
		}

		interaction.reply({
			embeds: [
				new Embed({
					color: EmbedColor.primary,
					title: 'Daily',
					description: `You got 10,000 ${emojis.coin}`,
				}),
			],
		});

		user.balance += 10000;
		user.cooldowns.set('daily', Math.ceil(now / 86400) * 86400);
		user.save();
	},
} satisfies Command;