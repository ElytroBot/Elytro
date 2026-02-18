import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dictionary')
		.setDescription('Get information on a word.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('word')
				.setDescription('The word you want to get information on.')
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const word = interaction.options.getString('word');

		try {
			const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);

			if (!response.ok)
				throw new Error('Word not found');

			const data = await response.json();
			const definition = data[0].meanings[0].definitions[0].definition;
			const example = data[0].meanings[0].definitions[0].example || 'No example available';
			const partOfSpeech = data[0].meanings[0].partOfSpeech;

			await interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: Color.Primary,
						title: `Definition for "${word}"`,
						fields: [
							{ name: 'Definition', value: definition },
							{ name: 'Part of Speech', value: partOfSpeech, inline: true },
							{ name: 'Example', value: example, inline: true }
						],
						footer: { text: 'Powered by dictionaryapi.dev' }
					})
				]
			});
		}
		catch (error) {
			await interaction.reply(Messages.ephemeral(Color.Danger, `${error.message}.`));
		}
	}
} satisfies Command;