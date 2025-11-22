import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

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

			const embed = new EmbedBuilder()
				.setColor(EmbedColor.primary)
				.setTitle(`Definition for "${word}"`)
				.addFields(
					{ name: 'Definition', value: definition },
					{ name: 'Part of Speech', value: partOfSpeech, inline: true },
					{ name: 'Example', value: example, inline: true }
				)
				.setFooter({ text: 'Powered by dictionaryapi.dev' });

			await interaction.reply({ embeds: [embed] });
		}
		catch (error) {
			const errorEmbed = new EmbedBuilder()
				.setColor(EmbedColor.danger)
				.setDescription(error.message + '.');

			await interaction.reply({
				embeds: [errorEmbed],
				flags: MessageFlags.Ephemeral
			});
		}
	}
} satisfies Command;