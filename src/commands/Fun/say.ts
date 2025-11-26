import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('say')
		.setDescription('Makes the bot say something.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('text')
				.setDescription('The text the bot will say.')
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		await interaction.reply(interaction.options.getString('text'));
	}
} satisfies Command;