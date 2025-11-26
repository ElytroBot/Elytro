import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('coin-flip')
		.setDescription('Flips a coin.'),

	async onCommandInteraction(interaction) {
		const side = Math.round(Math.random());

		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Coin Flip',
					description: `The coin is ${side == 0 ? 'heads' : 'tails'}!`,
					thumbnail: {
						url: `https://i.imgur.com/${side == 0? 'WwIZMNe' : '3Pvhkka'}.png`
					}
				})
			]
		});
	}
} satisfies Command;