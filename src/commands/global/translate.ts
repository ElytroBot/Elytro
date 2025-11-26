import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType, MessageContextMenuCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../../structure/Command';
import { load } from 'cheerio';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setType(ApplicationCommandType.Message)
		.setName('Translate')
		.setContexts(
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		),

	async onCommandInteraction(interaction: MessageContextMenuCommandInteraction) {
		if (interaction.targetMessage.content.length == 0) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(EmbedColor.danger)
						.setDescription('Cannot translate an empty message.')
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		await fetch(`https://translate.google.com/m?hl=${interaction.locale}&sl=auto&q=${interaction.targetMessage.content}`)
			.then(res => res.text())
			.then(text => interaction.reply({
				content: load(text)('.result-container').text(),
				flags: MessageFlags.Ephemeral
			}));
	}
} satisfies Command;