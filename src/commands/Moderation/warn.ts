import { ApplicationCommandType, ContextMenuCommandBuilder, EmbedBuilder, GuildMember, LabelBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, TextInputBuilder, TextInputStyle, UserContextMenuCommandInteraction } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setType(ApplicationCommandType.User)
		.setName('Warn')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async onCommandInteraction(interaction: UserContextMenuCommandInteraction) {
		await interaction.guild.members
			.fetch(interaction.targetUser.id)
			.then(
				async member => {
					if (member.id == interaction.guild.members.me.id) {
						return interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.danger,
									description: 'I cannot warn myself!'
								})
							],
							flags: MessageFlags.Ephemeral
						});
					}
					else if ((interaction.member as GuildMember).roles.highest.position <=
						member.roles.highest.position &&
						interaction.guild.ownerId != interaction.user.id) {
						return interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.danger,
									description:
										'You do not have a higher role than the target member.'
								})
							],
							flags: MessageFlags.Ephemeral
						});
					}

					return interaction.showModal(
						new ModalBuilder()
							.setCustomId(`Warn|${interaction.targetUser.id}`)
							.setTitle('Warn')
							.addLabelComponents(
								new LabelBuilder()
									.setLabel('Reason')
									.setDescription('Optional reason for the warning.')
									.setTextInputComponent(
										new TextInputBuilder()
											.setCustomId('reason')
											.setStyle(TextInputStyle.Short)
											.setMaxLength(100)
											.setRequired(false)
									)
							)
					);
				},
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'Could not find this user in this server.'
						})
					],
					flags: MessageFlags.Ephemeral
				})
			);
	},
	
	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		const userId = interaction.customId.split('|')[1];
		const reason = interaction.fields.getTextInputValue('reason');

		await Promise.all([
			GuildModel.updateOne(
				{ _id: interaction.guild.id },
				{ $push: { warns: { user_id: userId, reason: reason } } },
				{ upsert: true }
			),
			interaction.guild.members
				.fetch(userId)
				.then(user =>
					user.send({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								title: 'Warn',
								description: `You have been warned by ${interaction.member}.`,
								fields: [
									... reason? [{ name: 'Reason', value: reason }] : [],
									{ name: 'Server', value: interaction.guild.name }
								]
							})
						]
					})
				)
				.catch(() => {})
		])
			.then(() => interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Warn',
						fields: [
							{ name: 'User', value: `<@${userId}>` },
							... reason? [{ name: 'Reason', value: reason }] : []
						]
					})
				]
			}));
	}
} satisfies Command;