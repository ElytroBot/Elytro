import { ActionRowBuilder, ApplicationCommandType, ContextMenuCommandBuilder, EmbedBuilder, GuildMember, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, TextInputBuilder, TextInputStyle, UserContextMenuCommandInteraction } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setType(ApplicationCommandType.User)
		.setName('Warn')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

	async onCommandInteraction(interaction: UserContextMenuCommandInteraction) {
		interaction.guild.members
			.fetch(interaction.targetUser.id)
			.then(async member => {
				if (member.id == interaction.guild.members.me.id) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'I cannot warn myself!'
							})
						],
						ephemeral: true
					});
					return;
				}
				else if ((interaction.member as GuildMember).roles.highest.position <=
					member.roles.highest.position &&
					interaction.guild.ownerId != interaction.user.id) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description:
									'You do not have a higher role than the target member.'
							})
						],
						ephemeral: true
					});
					return;
				}

				const modal = new ModalBuilder()
					.setCustomId(`Warn|${interaction.targetUser.id}`)
					.setTitle('Warn')
					.addComponents(
						new ActionRowBuilder<TextInputBuilder>()
							.addComponents(
								new TextInputBuilder()
									.setCustomId('reason')
									.setLabel('Reason (optional)')
									.setStyle(TextInputStyle.Short)
									.setMaxLength(50)
									.setRequired(false)
							)
					);

				interaction.showModal(modal);
			})
			.catch(() => {
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'Could not find this user in this server.'
						})
					],
					ephemeral: true
				});
			});
	},
	
	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		const userId = interaction.customId.split('|')[1];
		const guild = await GuildModel.findById(interaction.guild.id) ??
			await GuildModel.create({ _id: interaction.guild.id });
		const reason = interaction.fields.getTextInputValue('reason');

		interaction.reply({
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
		});

		(await interaction.guild.members.fetch(userId)).send({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.danger,
					title: 'Warn',
					description: `You have been warned by ${interaction.member}.`,
					fields: [
						... reason? [{ name: 'Reason', value: reason }] : [],
						{ name: 'Server', value: interaction.guild.toString() }
					]
				})
			]
		}).catch();

		guild.warns.push({ user_id: userId, reason: reason });
		guild.save();
	}
} satisfies Command;