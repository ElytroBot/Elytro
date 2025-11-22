import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('warns')
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
				.setName('add')
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
						.setMaxLength(50)
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
		const guild = await GuildModel.findById(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
			case 'view':
				const embed = new EmbedBuilder({ color: EmbedColor.primary, title: 'Warns' });

				guild.warns.forEach(warn => {
					if (warn.user_id == user.id) {
						embed.addFields(
							{ name: '\u200b', value: '\u200b' },
							{ name: 'ID', value: warn._id, inline: true },
							{
								name: 'Reason',
								value: warn.reason ?? '`NONE`',
								inline: true
							}
						);
					}
				});
				interaction.reply({ embeds: [embed.spliceFields(0, 1)] });
				return;
			
			case 'add':
				const reason = interaction.options.getString('reason', false);
		
				interaction.guild.members
					.fetch(user.id)
					.then(async member => {
						if (member.id == interaction.guild.members.me.id) {
							interaction.reply({
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

						if ((interaction.member as GuildMember).roles.highest.position <=
							member.roles.highest.position &&
							interaction.guild.ownerId != interaction.user.id) {
							interaction.reply({
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
						
						interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.primary,
									title: 'Warn',
									fields: [
										{ name: 'User', value: user.toString() },
										... reason? [{ name: 'Reason', value: reason }] : []
									]
								})
							]
						});

						member.send({
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
						}).catch(() => {});
		
						guild.warns.push({ user_id: user.id, reason: reason });
						guild.save();
					})
					.catch(() => {
						interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.danger,
									description: 'Could not find this user in this server.'
								})
							],
							flags: MessageFlags.Ephemeral
						});
					});
				return;

			case 'delete':
				const id = interaction.options.getString('id');
				const index = guild.warns.findIndex(w => w._id == id);

				if (index == -1) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'User does not have a warning with this ID.'
							})
						],
						flags: MessageFlags.Ephemeral
					});
					return;
				}

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Warning Deleted',
							fields: [
								{ name: 'ID', value: id },
								{ name: 'User', value: `<@${guild.warns[index].user_id}>` },
								... guild.warns[index].reason?
									[{ name: 'Reason', value: guild.warns[id].reason }] : []
							]
						})
					]
				});

				guild.warns.splice(index, 1);
				guild.save();
		}
	}
} satisfies Command;