import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warnings')
		.setDescription('Commands related to Elytro\'s warning system.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('view')
				.setDescription('View a user\'s warnings.')
				.addUserOption(
					new SlashCommandUserOption()
						.setName('user')
						.setDescription('The user whose warnings you want to see.')
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('create')
				.setDescription('Warns a user.')
				.addUserOption(
					new SlashCommandUserOption()
						.setName('user')
						.setDescription('The user you want to warn.')
						.setRequired(true)
				)
				.addStringOption(
					new SlashCommandStringOption()
						.setName('reason')
						.setDescription('The reason for the warning.')
						.setMaxLength(100)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('delete')
				.setDescription('Deletes a warning.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('id')
						.setDescription('The ID of the warning.')
						.setRequired(true)
				)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user');

		switch (interaction.options.getSubcommand()) {
			case 'view':
				const warns = await GuildModel
					.findById(interaction.guild.id)
					.then(g => g?.warns.filter(w => w.user_id == user.id) ?? []);

				if (warns.length == 0) {
					await interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'This user has no warnings.'
							})
						],
						flags: MessageFlags.Ephemeral
					});
					return;
				}

				await interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Warnings',
							fields: warns
								.map(w => [
									{ name: '\u200b', value: '\u200b' },
									{ name: 'ID', value: w._id, inline: true },
									{
										name: 'Reason',
										value: w.reason ?? '`NONE`',
										inline: true
									}
								])
								.flat()
								.splice(1)
						})
					]
				});
				return;
			
			case 'create':
				const reason = interaction.options.getString('reason', false);
				const member = await interaction.guild.members.fetch(user.id).catch(() => {});

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
								description: 'You do not have a higher role than the target member.'
							})
						],
						flags: MessageFlags.Ephemeral
					});
					return;
				}

				await GuildModel
					.updateOne(
						{ _id: interaction.guild.id },
						{ $push: { warns: { user_id: user.id, reason: reason } } },
						{ upsert: true }
					)
					.then(() => Promise.all([
						member
							.send({
								embeds: [
									new EmbedBuilder({
										color: EmbedColor.danger,
										title: 'Warning',
										description: `You have been warned by ${interaction.member}.`,
										fields: [
											... reason? [{ name: 'Reason', value: reason }] : [],
											{ name: 'Server', value: interaction.guild.name }
										]
									})
								]
							})
							.catch(() => {}),
						interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.primary,
									title: 'Warning Created',
									fields: [
										{ name: 'User', value: user.toString() },
										... reason? [{ name: 'Reason', value: reason }] : []
									]
								})
							]
						})
					]));
				return;

			case 'delete':
				const id = interaction.options.getString('id');
				const warning = await GuildModel
					.findOneAndUpdate(
						{ _id: interaction.guild.id },
						{ $pull: { warns: { _id: id } } }
					)
					.then(doc => doc.warns.find(w => w._id == id));

				if (!warning) {
					await interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'No warning with this ID exists.'
							})
						],
						flags: MessageFlags.Ephemeral
					});
					return;
				}

				await interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Warning Deleted',
							fields: [
								{ name: 'ID', value: id },
								{ name: 'User', value: `<@${warning.user_id}>` },
								... warning.reason? [{ name: 'Reason', value: warning.reason }] : []
							]
						})
					]
				});
		}
	}
} satisfies Command;