import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, SlashCommandIntegerOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Purges an amount of messages newer than 2 weeks.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName('amount')
				.setDescription('The amount of messages to purge.')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(100)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const amount = interaction.options.getInteger('amount');

		await interaction.channel.bulkDelete(amount, true);
		
		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Purge',
					fields: [{ name: 'Amount', value: amount.toString() }]
				})
			],
			flags: MessageFlags.Ephemeral
		});
	}
} satisfies Command;