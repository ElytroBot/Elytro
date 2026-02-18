import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, SlashCommandChannelOption, TextChannel } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unlock')
		.setDescription('Unlocks a channel.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption(
			new SlashCommandChannelOption()
				.setName('channel')
				.setDescription('The channel you want to unlock.')
				.addChannelTypes(ChannelType.GuildText)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;

		await channel.permissionOverwrites
			.edit(interaction.guild.roles.everyone.id, {
				SendMessages: null,
				SendMessagesInThreads: null,
				CreatePublicThreads: null,
				CreatePrivateThreads: null
			})
			.then(
				() => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: Color.Primary,
							title: 'Unlock',
							fields: [{ name: 'Channel', value: channel.toString() }]
						})
					]
				}),
				() => interaction.reply(Messages.MissingPermissions)
			);
	}
} satisfies Command;