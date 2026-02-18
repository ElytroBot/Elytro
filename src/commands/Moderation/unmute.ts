import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

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
			await interaction.reply(Messages.MemberNotFound);
			return;
		}
		else if (!member.isCommunicationDisabled()) {
			await interaction.reply(Messages.ephemeral(Color.Danger, 'This user is not muted!'));
			return;
		}
		else if (!member.manageable) {
			await interaction.reply(Messages.ephemeral(Color.Danger, 'I cannot unmute a user with a higher or equal role.'));
			return;
		}

		await member
			.timeout(null)
			.then(
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: Color.Primary,
							title: 'Unmute',
							fields: [{ name: 'User', value: user.toString() }]
						})
					]
				}),
				() => interaction.reply(Messages.MissingPermissions)
			);
	}
} satisfies Command;