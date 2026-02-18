import { ApplicationCommandType, ApplicationIntegrationType, ContextMenuCommandBuilder, InteractionContextType, MessageContextMenuCommandInteraction, MessageFlags } from 'discord.js';
import { Command } from '../../structure/Command';
import { load } from 'cheerio';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

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
			await interaction.reply(Messages.ephemeral(Color.Danger, 'Cannot translate an empty message.'));
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