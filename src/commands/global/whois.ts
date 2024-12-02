import { ChatInputCommandInteraction, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { Embed, EmbedColor } from '../../structure/Embed';
import emojis from '../../json/emojis.json';
import { GuildModel } from '../../schemas/Guild';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('whois')
		.setDescription('Shows information about a user.')
		.setDefaultMemberPermissions(PermissionFlagsBits.UseApplicationCommands)
		.setContexts(InteractionContextType.Guild)
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user whose information you want to see.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user') ?? interaction.user;

		interaction.guild.members
			.fetch(user.id)
			.then(async member => {
				const dbGuild = await GuildModel.findById(interaction.guild.id);

				interaction.reply({
					embeds: [
						new Embed({
							color: EmbedColor.primary,
							title: 'Whois',
							fields: [
								{
									name: 'Display Name',
									value: member.displayName,
									inline: true
								},
								{
									name: 'Joined',
									value: `<t:${Math.floor(member.joinedTimestamp / 1000 )}:d>`,
									inline: true
								},
								{
									name: 'Registered',
									value: `<t:${Math.floor(user.createdTimestamp / 1000)}:d>`,
									inline: true
								},
								... member.roles.cache.size - 1 > 0? [{
									name: `Roles (${member.roles.cache.size - 1})`,
									value: member.roles.cache
										.filter(role => role.name != '@everyone')
										.map(role => role.toString())
										.join(' ')
								}] : [],
								{
									name: 'Highest Role',
									value: member.roles.highest.toString(),
									inline: true
								},
								{
									name: 'Warns',
									value: dbGuild? dbGuild.warns
										.filter(warn => warn.user_id == member.id)
										.length.toString() :
										'0',
									inline: true
								},
								{
									name: 'Status',
									value: `${emojis[member.presence.status ?? 'offline']} ${member.presence.status ?? 'offline'}`,
									inline: true
								}
							]
						}).setThumbnail(member.displayAvatarURL())
					]
				});
			})
			.catch(() => {
				interaction.reply({
					embeds: [
						new Embed({
							color: EmbedColor.danger,
							description: 'Could not find this user in this server.'
						})
					],
					ephemeral: true
				});
			});
	}
} satisfies Command;