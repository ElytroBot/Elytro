import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('wyr')
		.setDescription('Asks a would you rather question.'),

	async onCommandInteraction(interaction) {
		await fetch(
			'https://would-you-rather.p.rapidapi.com/wyr/random',
			{ headers: { 'x-rapidapi-key': process.env.RAPID_API_KEY } }
		)
			.then(res => res.json())
			.then(
				json => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: Color.Primary,
							title: 'Would You Rather',
							description: json[0].question,
							footer: { text: 'Powered by rapidapi.com' }
						})
					]
				}),
				() => interaction.reply(Messages.ephemeral(Color.Danger, 'It looks like there was an issue with our wyr API. Please try again later.'))
			);
	}
} satisfies Command;