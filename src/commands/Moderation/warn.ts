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
		const member = await interaction.guild.members.fetch(interaction.targetUser.id).catch(() => {});

		if (!member) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'Could not find this user in this server.'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		else if (member.id == interaction.applicationId) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'I cannot warn myself!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		else if ((interaction.member as GuildMember).roles.highest.position <=
			member.roles.highest.position &&
			interaction.guild.ownerId != interaction.user.id) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description:
							'You do not have a higher role than the target member.'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		await interaction.showModal(
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
	
	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		const userId = interaction.customId.split('|')[1];
		const reason = interaction.fields.getTextInputValue('reason');

		await GuildModel
			.updateOne(
				{ _id: interaction.guild.id },
				{ $push: { warns: { user_id: userId, reason: reason } } },
				{ upsert: true }
			)
			.then(() => Promise.all([
				interaction.guild.members
					.fetch(userId)
					.then(user =>
						user.send({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.danger,
									author: {
										name: interaction.user.displayName,
										icon_url: interaction.user.avatarURL()
									},
									title: 'Warning',
									description: `> ${reason || 'No reason specified.'}`,
									footer: {
										text: interaction.guild.name,
										icon_url: interaction.guild.iconURL()
									}
								})
							]
						})
					)
					.catch(() => {}),
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Warning Created',
							fields: [
								{ name: 'User', value: `<@${userId}>` },
								... reason? [{ name: 'Reason', value: reason }] : []
							]
						})
					]
				})
			]));
	}
} satisfies Command;