import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wyr')
		.setDescription('Asks a would you rather question.'),

	async onCommandInteraction(interaction) {
		fetch(
			'https://would-you-rather.p.rapidapi.com/wyr/random',
			{ headers: { 'x-rapidapi-key': process.env.RAPID_API_KEY } }
		)
			.then(res => res.json())
			.then(json => {
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Would You Rather',
							description: json[0].question,
							footer: { text: 'Powered by rapidapi.com' }
						})
					]
				});
			})
			.catch(() => {
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'It looks like there was an issue with our wyr API. Please try again later.'
						})
					],
					ephemeral: true
				});
			});
	}
} satisfies Command;