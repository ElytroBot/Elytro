import { ApplicationIntegrationType, ChatInputCommandInteraction, ContainerBuilder, FileUploadBuilder, InteractionContextType, LabelBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, SlashCommandBuilder, TextChannel, TextDisplayBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
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
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		await interaction.showModal(
			new ModalBuilder()
				.setCustomId('report')
				.setTitle('Bug Report')
				.addLabelComponents(
					new LabelBuilder()
						.setLabel('Description')
						.setDescription('Provide a description of the bug.')
						.setTextInputComponent(
							new TextInputBuilder()
								.setCustomId('description')
								.setStyle(TextInputStyle.Paragraph)
								.setMaxLength(1000)
						),
					new LabelBuilder()
						.setLabel('Screenshots')
						.setDescription('Attach images of the bug.')
						.setFileUploadComponent(
							new FileUploadBuilder()
								.setCustomId('screenshots')
								.setMaxValues(5)
						)
				)
		);
	},

	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		await interaction.client.guilds
			.fetch('1176349182844485652')
			.then(guild => guild.channels.fetch('1306349957393154068'))
			.then((channel: TextChannel) => channel.send({
				components: [
					new ContainerBuilder()
						.setAccentColor(EmbedColor.danger)
						.addTextDisplayComponents(
							new TextDisplayBuilder()
								.setContent(`## Bug Report\n${interaction.fields.getTextInputValue('description')}`)
						)
						.addMediaGalleryComponents(
							new MediaGalleryBuilder()
								.addItems(
									interaction.fields.resolved.attachments
										.map(attachment => new MediaGalleryItemBuilder().setURL(attachment.url))
								)
						)
				],
				flags: MessageFlags.IsComponentsV2
			}));

		await interaction.reply({
			content: 'Thank you for taking the time to report this bug! Our team is actively working on fixing the issue. For further assistance or updates, feel free to join our Discord community: https://discord.gg/CXSsdwhgwb.',
			flags: MessageFlags.Ephemeral
		});
	}
} satisfies Command;