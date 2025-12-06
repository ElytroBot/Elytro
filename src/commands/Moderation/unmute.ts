import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unmute')
		.setDescription('Unmutes a muted user.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user to unmute.')
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user');
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
		else if (!member.isCommunicationDisabled()) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'This user is not muted!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}
		else if (!member.manageable) {
			await interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'I cannot unmute a user with a higher or equal role.'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		await member
			.timeout(null)
			.then(
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Unmute',
							fields: [{ name: 'User', value: user.toString() }]
						})
					]
				}),
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'I do not have the required permissions.'
						})
					],
					flags: MessageFlags.Ephemeral
				})
			);
	}
} satisfies Command;