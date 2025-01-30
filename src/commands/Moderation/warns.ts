import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from 'discord.js';
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
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('delete')
				.setDescription('Deletes a warning.')
				.addIntegerOption(
					new SlashCommandIntegerOption()
						.setName('id')
						.setDescription('The ID of the warning.')
						.setMinValue(0)
						.setRequired(true)
				)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user');
		const guild = await GuildModel.findById(interaction.guild.id);

		switch (interaction.options.getSubcommand()) {
			case 'view':
				const embed = new EmbedBuilder({ color: EmbedColor.primary, title: 'Warns' });

				guild.warns.forEach((warn, i) => {
					if (warn.user_id == user.id) {
						embed.addFields(
							{ name: '\u200b', value: '\u200b' },
							{ name: 'ID', value: i.toString(), inline: true },
							{
								name: 'Reason',
								value: warn.reason ? warn.reason : '`NONE`',
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
								ephemeral: true
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
								ephemeral: true
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
									] as Array<{ name: string; value: string }>
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
							ephemeral: true
						});
					});
				return;

			case 'delete':
				const id = interaction.options.getInteger('id');

				if (!guild.warns[id]) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'User does not have a warning with this ID.'
							})
						],
						ephemeral: true
					});
					return;
				}

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Warning Deleted',
							fields: [
								{ name: 'ID', value: id.toString() },
								{ name: 'User', value: `<@${guild.warns[id].user_id}>` },
								... guild.warns[id].reason?
									[{ name: 'Reason', value: guild.warns[id].reason }] : []
							]
						})
					]
				});

				guild.warns.splice(id, 1);
				guild.save();
		}
	}
} satisfies Command;