import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, SlashCommandChannelOption, TextChannel } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lock')
		.setDescription('Locks a channel.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption(
			new SlashCommandChannelOption()
				.setName('channel')
				.setDescription('The channel you want to lock.')
				.addChannelTypes(ChannelType.GuildText)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const channel = (interaction.options.getChannel('channel') ?? interaction.channel) as TextChannel;

		await channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, {
			SendMessages: false,
			SendMessagesInThreads: false,
			CreatePublicThreads: false,
			CreatePrivateThreads: false
		});

		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Lock',
					fields: [{ name: 'Channel', value: channel.toString() }]
				})
			]
		});
	}
} satisfies Command;