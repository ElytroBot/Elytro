import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, EmbedBuilder, InteractionContextType, MessageContextMenuCommandInteraction } from 'discord.js';
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
			interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(EmbedColor.danger)
						.setDescription('Cannot translate an empty message.')
				],
				ephemeral: true
			});
			return;
		}

		const res = await fetch(`https://translate.google.com/m?hl=${interaction.locale}&sl=auto&q=${interaction.targetMessage.content}`);

		interaction.reply({
			content: load(await res.text())('.result-container').text(),
			ephemeral: true
		});
	}
} satisfies Command;