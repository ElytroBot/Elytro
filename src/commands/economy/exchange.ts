import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, ModalSubmitInteraction, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exchange')
		.setDescription('Trade on the Elytro exchange.'),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		interaction.reply(getMessage());
	},

	async onButtonInteraction(interaction) {
		interaction.update(getMessage());
	},

	async onSelectMenuInteraction(interaction: StringSelectMenuInteraction) {
		switch (interaction.values[0]) {
			case 'Market Order':
				interaction.showModal(
					new ModalBuilder()
						.setCustomId(`${interaction.customId}|${interaction.values[0]}`)
						.setTitle('Market Order')
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>()
								.addComponents(
									new TextInputBuilder()
										.setCustomId('shares')
										.setLabel('Shares')
										.setStyle(TextInputStyle.Short)
										.setPlaceholder('1')
										.setRequired(true)
								)
						)
				);
				return;

			case 'Limit Order':
				interaction.showModal(
					new ModalBuilder()
						.setCustomId(`${interaction.customId}|${interaction.values[0]}`)
						.setTitle('Limit Order')
						.addComponents(
							new ActionRowBuilder<TextInputBuilder>()
								.addComponents(
									new TextInputBuilder()
										.setCustomId('limit_price')
										.setLabel('Limit Price')
										.setStyle(TextInputStyle.Short)
										.setRequired(true)
								),
							new ActionRowBuilder<TextInputBuilder>()
								.addComponents(
									new TextInputBuilder()
										.setCustomId('shares')
										.setLabel('Shares')
										.setStyle(TextInputStyle.Short)
										.setPlaceholder('1')
										.setRequired(true)
								)
						)
				);
		}
	},

	async onModalSubmitInteraction(interaction: ModalSubmitInteraction) {
		interaction.reply({
			content: interaction.fields.getTextInputValue('shares'),
			ephemeral: true
		});
	}
} satisfies Command;

function getMessage() {
	return {
		embeds: [
			new EmbedBuilder({
				color: EmbedColor.primary,
				title: 'Exchange',
				fields: [
					{ name: 'Market Cap', value: '5B', inline: true },
					{ name: 'Volume', value: '3.2K', inline: true },
					{ name: 'Average Volume', value: '4.6K', inline: true }
				],
				image: { url: 'https://www.ledr.com/colours/white.jpg' }
			})
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				Button.primary({
					custom_id: 'exchange|refresh',
					emoji: '<:refresh:1264290905519554661>'
				})
			),
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder({
					custom_id: 'exchange|buy',
					placeholder: 'Buy',
					options: [
						{ label: 'Market Order', value: 'Market Order' },
						{ label: 'Limit Order', value: 'Limit Order' }
					]
				})
			),
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder({
					custom_id: 'exchange|sell',
					placeholder: 'Sell',
					options: [
						{ label: 'Market Order', value: 'Market Order' },
						{ label: 'Limit Order', value: 'Limit Order' }
					]
				})
			)
		]
	};
}