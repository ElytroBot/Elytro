import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { ActionRowBuilder, EmbedBuilder } from '@discordjs/builders';
import { Color } from '../../structure/Color';
import tutorials from '../../json/tutorials.json';
import { Button } from '../../structure/Button';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tutorial')
		.setDescription('Get tutorials for different topics.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('tutorial')
				.setDescription('The tutorial you want view.')
				.addChoices(Object.keys(tutorials).map(t => ({ name: t, value: t })))
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		await interaction.reply(paginate(0, interaction.options.getString('tutorial')));
	},

	async onButtonInteraction(interaction) {
		if (interaction.user.id != interaction.message.interactionMetadata.user.id) {
			await interaction.reply(Messages.ComponentUseNotAllowed);
			return;
		}

		if (interaction.customId == 'finish') {
			await Promise.all([
				interaction.message.delete(),
				interaction.reply(Messages.ephemeral(Color.Success, 'Tutorial successfully completed!'))
			]);
			return;
		}

		const [tutorial, page] = interaction.customId.split('|');

		await interaction.update(paginate(Number(page), tutorial));
	}
} satisfies Command;

function paginate(page: number, tutorial: string) {
	return {
		embeds: [
			new EmbedBuilder({
				color: Color.Primary,
				...tutorials[tutorial][page]
			})
		],
		components: [
			new ActionRowBuilder<Button>()
				.addComponents(
					Button.primary({
						custom_id: `${tutorial}|${page - 1}`,
						label: 'Previous',
						disabled: page == 0
					}),
					Button.primary({
						custom_id: page == tutorials[tutorial].length - 1 ? 'finish' : `${tutorial}|${page + 1}`,
						label: page == tutorials[tutorial].length - 1 ? 'Finish' : 'Next'
					})
				)
		]
	};
}