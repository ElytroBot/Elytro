import { ChatInputCommandInteraction, EmbedBuilder, InteractionContextType, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('suggest')
		.setDescription('Creates a suggestion.')
		.setContexts(InteractionContextType.Guild)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('suggestion')
				.setDescription('The suggestion.')
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const message = await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Suggestion',
					author: {
						name: interaction.user.displayName,
						iconURL: interaction.user.avatarURL()
					},
					description: interaction.options.getString('suggestion')
				})
			],
			fetchReply: true
		});

		message.react(emojis.upvote);
		message.react(emojis.downvote);
	}
} satisfies Command;