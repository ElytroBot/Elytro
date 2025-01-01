import { ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import outcomes from '../../json/outcomes.json';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';
import trivia from '../../json/trivia.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('minigame')
		.setDescription('Minigames you can play.')
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('rps')
				.setDescription('Play rock paper scissors.')
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('trivia')
				.setDescription('Asks you a trivia question.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		switch (interaction.options.getSubcommand()) {
			case 'rps':
				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					Button.primary({ custom_id: '0', emoji: '🪨' }),
					Button.primary({ custom_id: '1', emoji: '📄' }),
					Button.primary({ custom_id: '2', emoji: '✂️' })
				);

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'RPS',
							description: 'Click your move.'
						})
					],
					components: [row]
				});
				return;

			case 'trivia':
				const questionObject = trivia[Math.floor(Math.random() * trivia.length)];
				const options = shuffleOptions(questionObject.options);
				const optionsRow = new ActionRowBuilder<ButtonBuilder>();

				let formattedQuestion = questionObject.question + '\n\n';
				options.forEach((option, index) => {
					const letter = String
						.fromCharCode(index.toString().charCodeAt(0) + 17);

					formattedQuestion += `${letter}. ${option}\n`;
					optionsRow.addComponents(
						Button.primary({
							custom_id: `${option}|${questionObject.answer}`,
							label: letter
						})
					);
				});

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Trivia',
							description: formattedQuestion
						})
					],
					components: [optionsRow]
				});
				return;
		}
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		if (interaction.user.id != interaction.message.interaction.user.id) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You are not allowed to use this button!'
					})
				],
				ephemeral: true
			});
			return;
		}

		switch (interaction.message.interaction.commandName) {
			case 'minigame rps':
				const outcome = Math.floor(Math.random() * 3);
				const message = outcomes.rps[outcome][
					Math.floor(Math.random() * outcomes.rps[outcome].length)
				];

				interaction.update({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'RPS',
							description: message,
							footer: {
								text: outcome == 0? 'You Won' : 
									outcome == 1? 'You Tied' : 'You Lost'
							}
						})
					],
					components: []
				});
				return;

			case 'minigame trivia':
				const segments = interaction.customId.split('|');

				if (segments[0] == segments[1]) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.success,
								title: 'Trivia',
								description: 'That is the correct answer!'
							})
						]
					});
				}
				else {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								title: 'Trivia',
								description: `Incorrect. The correct answer is \`\`${segments[1]}\`\`.`
							})
						]
					});
				}

				const editedRow = new ActionRowBuilder<ButtonBuilder>();

				interaction.message.components[0].components
					.forEach((button: ButtonComponent) => {
						const segments = button.customId.split('|');

						editedRow.addComponents(
							new ButtonBuilder({
								custom_id: button.customId,
								label: button.label,
								disabled: true,
								style: segments[0] == segments[1]? ButtonStyle.Success :
									interaction.customId == button.customId? ButtonStyle.Danger :
										ButtonStyle.Secondary
							})
						);
					});

				interaction.message.edit({ components: [editedRow] });
		}
	}
} satisfies Command;

function shuffleOptions(array: string[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}

	return array;
}