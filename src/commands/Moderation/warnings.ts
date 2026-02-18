import { ChatInputCommandInteraction, EmbedBuilder, GuildMember, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

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
					await interaction.reply(Messages.ephemeral(Color.Danger, 'This user has no warnings.'));
					return;
				}

				await interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: Color.Primary,
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
					await interaction.reply(Messages.MemberNotFound);
					return;
				}
				else if (member.id == interaction.applicationId) {
					await interaction.reply(Messages.ephemeral(Color.Danger, 'I cannot warn myself!'));
					return;
				}
				else if (
					(interaction.member as GuildMember).roles.highest.position <= member.roles.highest.position
					&& interaction.guild.ownerId != interaction.user.id
				) {
					await interaction.reply(Messages.HigherRole);
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
										color: Color.Danger,
										author: {
											name: interaction.user.displayName,
											icon_url: interaction.user.avatarURL()
										},
										title: 'Warning',
										description: `> ${reason ?? 'No reason specified.'}`,
										footer: {
											text: interaction.guild.name,
											icon_url: interaction.guild.iconURL()
										}
									})
								]
							})
							.catch(() => {}),
						interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: Color.Primary,
									title: 'Warning Created',
									fields: [
										{ name: 'User', value: user.toString() },
										...reason ? [{ name: 'Reason', value: reason }] : []
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
					await interaction.reply(Messages.ephemeral(Color.Danger, 'No warning with this ID exists.'));
					return;
				}

				await interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: Color.Primary,
							title: 'Warning Deleted',
							fields: [
								{ name: 'ID', value: id },
								{ name: 'User', value: `<@${warning.user_id}>` },
								...warning.reason ? [{ name: 'Reason', value: warning.reason }] : []
							]
						})
					]
				});
		}
	}
} satisfies Command;