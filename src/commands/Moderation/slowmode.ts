import { SlashCommandBuilder, PermissionFlagsBits, SlashCommandChannelOption, ChannelType, ChatInputCommandInteraction, TextChannel, SlashCommandIntegerOption, EmbedBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('slowmode')
		.setDescription('Turn on slowmode for a channel (defaults to the current channel).')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName('duration')
				.setDescription('The duration of slowmode in seconds. Set to 0 to cancel slowmode.')
				.setMinValue(0)
				.setMaxValue(21600)
				.setRequired(true)
		)
		.addChannelOption(
			new SlashCommandChannelOption()
				.setName('channel')
				.setDescription('The channel to turn on slowmode for.')
				.addChannelTypes(ChannelType.GuildText)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
		const channel = interaction.options.getChannel('channel') as TextChannel ?? interaction.channel;
		const duration = interaction.options.getInteger('duration');

		await channel.setRateLimitPerUser(duration);

		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.success,
					title: 'Slowmode Set',
					fields: [
						{ name: 'Duration', value: `${duration}s` },
						{ name: 'Channel', value: `<#${channel.id}>` }
					]
				})
			]
		});
	}
} satisfies Command;