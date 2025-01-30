import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import outcomes from '../../json/outcomes.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription('Beg for some extra coins.'),

	async onCommandInteraction(interaction) {
		const user = await UserModel.findById(interaction.user.id) ??
			await UserModel.create({ _id: interaction.user.id });
		const now = Math.floor(Date.now() / 1000);

		if (user.cooldowns.get('beg') > now) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You are on cooldown! Come back <t:${user.cooldowns.get('beg')}:R>`
					})
				],
				ephemeral: true
			});
			return;
		}

		if (Math.round(Math.random()) == 0) {
			const money = Math.round(Math.random() * 200 + 300);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Beg',
						description: outcomes.beg.success[
							Math.floor(Math.random() * outcomes.beg.success.length)
						].replace('{money}', `${money} ${emojis.coin}`)
					})
				]
			});
			user.balance += money;
		}
		else {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Beg',
						description:
							outcomes.beg.fail[
								Math.floor(Math.random() * outcomes.beg.fail.length)
							]
					})
				]
			});
		}

		user.cooldowns.set('beg', now + 30);
		user.save();
	}
} satisfies Command;