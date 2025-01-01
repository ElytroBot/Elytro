import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import wyr from '../../json/wyr.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wyr')
		.setDescription('Asks a would you rather question.'),

	async onCommandInteraction(interaction) {
		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Would You Rather',
					description: wyr[Math.floor(Math.random() * wyr.length)]
				})
			]
		});
	}
} satisfies Command;