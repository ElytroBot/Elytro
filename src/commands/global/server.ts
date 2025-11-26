import { ChatInputCommandInteraction, EmbedBuilder, Guild, InteractionContextType, PresenceStatus, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Commands related to this server.')
		.setContexts(InteractionContextType.Guild)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('info')
				.setDescription('Gives info about this server.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder({ color: EmbedColor.primary, title: 'Server Info' })
					.addFields(
						{ name: 'Name', value: interaction.guild.name, inline: true },
						{
							name: 'Owner',
							value: (await interaction.guild.fetchOwner()).toString(),
							inline: true
						},
						{
							name: 'Members',
							inline: true,
							value: `${interaction.guild.memberCount.toString()}\n${await formatStatuses(
								interaction.guild
							)}`
						},
						{
							name: 'Created',
							value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:d>`,
							inline: true
						},
						{
							name: 'Boost Tier',
							value: interaction.guild.premiumTier.toString(),
							inline: true
						},
						{
							name: 'Boosts',
							value: interaction.guild.premiumSubscriptionCount.toLocaleString(),
							inline: true
						}
					)
					.setThumbnail(interaction.guild.iconURL())
			]
		});
	}
} satisfies Command;

async function formatStatuses(guild: Guild) {
	await guild.members.fetch({ withPresences: true });

	return `${emojis.online} ${usersWithStatus(guild, 'online')}
		${emojis.dnd} ${usersWithStatus(guild, 'dnd')}
		${emojis.idle} ${usersWithStatus(guild, 'idle')}
		${emojis.offline} ${usersWithStatus(guild, 'offline')}`;
}

function usersWithStatus(guild: Guild, status: PresenceStatus) {
	if (status === 'offline') {
		return guild.members.cache.filter(
			member => !member.presence || member.presence.status == 'offline'
		).size;
	}

	return guild.members.cache.filter(
		member => member.presence?.status === status
	).size;
}