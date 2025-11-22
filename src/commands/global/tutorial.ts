import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { ActionRowBuilder, EmbedBuilder } from '@discordjs/builders';
import { EmbedColor } from '../../structure/EmbedColor';
import tutorials from '../../json/tutorials.json';
import { Button } from '../../structure/Button';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tutorial')
		.setDescription('Get tutorials for different topics.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('tutorial')
				.setDescription('The tutorial you want.')
				.addChoices(
					{ name: 'Economy', value: 'Economy' }
				)
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const tutorial = interaction.options.getString('tutorial');

		interaction.reply({
			embeds: [
				new EmbedBuilder(tutorials[tutorial][0])
					.setColor(EmbedColor.primary)
			],
			components: [getActionRow(tutorial, 0)]
		});
	},

	async onButtonInteraction(interaction) {
		if (interaction.user.id != interaction.message.interactionMetadata.user.id) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You are not allowed to use this button!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		if (interaction.customId == 'finish') {
			interaction.message.delete();

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.success,
						description: 'Tutorial successfully completed!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const [tutorial, page] = interaction.customId.split('|');

		interaction.update({
			embeds: [
				new EmbedBuilder(tutorials[tutorial][page])
					.setColor(EmbedColor.primary)
			],
			components: [getActionRow(tutorial, Number(page))]
		});
	}
} satisfies Command;

function getActionRow(tutorial: string, page: number) {
	return new ActionRowBuilder<Button>()
		.addComponents(
			Button.primary({
				custom_id: `${tutorial}|${page - 1}`,
				label: 'Previous',
				disabled: page == 0
			}),
			Button.primary({
				custom_id: page == (<object[]>tutorials[tutorial]).length - 1? 'finish' : `${tutorial}|${page + 1}`,
				label: page == (<object[]>tutorials[tutorial]).length - 1? 'Finish' : 'Next'
			})
		);
}