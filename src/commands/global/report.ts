import { ApplicationIntegrationType, ChatInputCommandInteraction, EmbedBuilder, InteractionContextType, SlashCommandAttachmentOption, SlashCommandBuilder, SlashCommandStringOption, TextChannel } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('report')
		.setDescription('Reports a bug to the team.')
		.setContexts(
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('description')
				.setDescription('The description of the bug.')
				.setRequired(true)
		)
		.addAttachmentOption(
			new SlashCommandAttachmentOption()
				.setName('screenshot')
				.setDescription('The screenshot of the bug.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const channel = await (
			await interaction.client.guilds.fetch('1176349182844485652')
		).channels.fetch('1306349957393154068');
		const screenshot = interaction.options.getAttachment('screenshot');

		(channel as TextChannel).send({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.danger,
					title: 'Bug Report',
					fields: [
						{ name: 'Description', value: interaction.options.getString('description') },
						...screenshot? [{ name: 'Screenshot', value: screenshot.url }] : []
					],
					footer: {
						text: interaction.user.username,
						iconURL: interaction.user.avatarURL()
					}
				})
			]
		});

		interaction.reply({
			content: 'Thank you for taking the time to report this bug! Our team is actively working on fixing the issue. For further assistance or updates, feel free to join our Discord community: https://discord.gg/CXSsdwhgwb.',
			ephemeral: true
		});
	}
} satisfies Command;