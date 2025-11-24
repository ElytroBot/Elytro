import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unban')
		.setDescription('Unbans a user.')
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user to unban.')
				.setRequired(true)
		)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('reason')
				.setDescription('The reason for the unban.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason', false);

		await interaction.guild.members
			.unban(user, reason)
			.then(
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Unban',
							fields: [
								{ name: 'User', value: user.toString() },
								... reason? [{ name: 'Reason', value: reason }] : []
							]
						})
					]
				}),
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'This user is not banned.'
						})
					],
					flags: MessageFlags.Ephemeral
				})
			);
	}
} satisfies Command;