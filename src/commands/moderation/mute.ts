import { ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('mute')
		.setDescription('Mutes a user.')
		.setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers)
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user to mute.')
				.setRequired(true)
		)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName('time')
				.setDescription('The amount of time to mute a user.')
				.addChoices(
					{ name: '1 minute', value: 1 },
					{ name: '5 minutes', value: 5 },
					{ name: '10 minutes', value: 10 },
					{ name: '15 minutes', value: 15 },
					{ name: '30 minutes', value: 30 },
					{ name: '45 minutes', value: 45 },
					{ name: '1 hour', value: 60 },
					{ name: '5 hours', value: 300 },
					{ name: '10 hours', value: 600 },
					{ name: '1 day', value: 1440 },
					{ name: '5 day', value: 7200 },
					{ name: '10 day', value: 14400 },
					{ name: '28 day', value: 40320 }
				)
		)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('reason')
				.setDescription('The reason for the mute.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason', false);
		const time = interaction.options.getInteger('time') ?? 5;

		interaction.guild.members
			.fetch(user.id)
			.then(member => {
				if (member.id == interaction.guild.members.me.id) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'I cannot mute myself!'
							})
						],
						ephemeral: true
					});
					return;
				}

				if (!member.moderatable) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description:
									'I cannot mute a user with a higher or equal role.'
							})
						],
						ephemeral: true
					});
					return;
				}

				member.timeout(time * 60000, reason);
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Mute',
							fields: [
								{ name: 'User', value: user.toString() },
								{ name: 'Time', value: mapChoice(time) },
								... reason? [{ name: 'Reason', value: reason }] : []
							]
						})
					]
				});
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
	}
} satisfies Command;

function mapChoice(value: number) {
	switch (value) {
		case 1: return '1 minute';
		case 5: return '5 minutes';
		case 10: return '10 minutes';
		case 15: return '15 minutes';
		case 30: return '30 minutes';
		case 45: return '45 minutes';
		case 60: return '1 hour';
		case 300: return '5 hours';
		case 600: return '10 hours';
		case 1440: return '1 day';
		case 7200: return '5 days';
		case 14400: return '10 days';
		case 40320: return '28 days';
	}
}