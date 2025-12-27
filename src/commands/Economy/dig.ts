import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import outcomes from '../../json/outcomes.json';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dig')
		.setDescription('Dig for coins.'),

	async onCommandInteraction(interaction) {
		const user = await UserModel.findById(interaction.user.id);

		if (!(user?.inventory?.get('Shovel') > 0)) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You need a **${emojis.Shovel} Shovel** in order to dig! Try using \`/shop buy shovel\` to buy one.`
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const now = Math.floor(Date.now() / 1000);

		if (user.cooldowns.get('dig') > now) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You are on cooldown! Come back <t:${user.cooldowns.get('dig')}:R>`
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const random = Math.round(Math.random() * 100);


		if (random < 5) {
			const money = Math.round(Math.random() * 10000 + 20000);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Dig',
						description: `Your shovel broke, you can buy another shovel with \`/shop buy shovel\``
					})
				]
			});
			user.inventory.set(
				"Shovel",
				(user.inventory.get("Shovel")) - 1
			);
			return;
		}

		if (random < 5) {
			const money = Math.round(Math.random() * 10000 + 20000);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Dig',
						description: `YOU FOUND A CHEST WITH ${money.toLocaleString()} ${emojis.coin} IN IT!!!!`
					})
				]
			});
			user.balance += money;
		}
		else if (random < 50) {
			const money = Math.round(Math.random() * 300 + 700);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Dig',
						description: outcomes.dig.success[
							Math.floor(Math.random() * outcomes.dig.success.length)
						].replace('{money}', `${money.toLocaleString()} ${emojis.coin}`)
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
						title: 'Dig',
						description:
							outcomes.dig.fail[
								Math.floor(Math.random() * outcomes.dig.fail.length)
							]
					})
				]
			});
		}

		user.cooldowns.set('dig', now + 45);
		user.save();
	}
} satisfies Command;