import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonComponent, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import outcomes from '../../json/outcomes.json';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';

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
			case 'rps': {
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
			}

			case 'trivia': {
				fetch('https://the-trivia-api.com/v2/questions?limit=1')
					.then(res => res.json())
					.then(json => {
						const options = [json[0].correctAnswer, ...json[0].incorrectAnswers]
							.sort(() => Math.random() - 0.5);
						const row = new ActionRowBuilder<ButtonBuilder>();

						let formattedQuestion = json[0].question.text + '\n\n';
						options.forEach((option, index) => {
							const letter = String.fromCharCode(index.toString().charCodeAt(0) + 17);
			
							formattedQuestion += `${letter}. ${option}\n`;
							row.addComponents(
								Button.primary({
									custom_id: `${option}|${json[0].correctAnswer}`,
									label: letter
								})
							);
						});

						interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.primary,
									title: 'Trivia',
									description: formattedQuestion,
									footer: { text: 'Powered by the-trivia-api.com' }
								})
							],
							components: [row]
						});
					})
					.catch(() => {
						interaction.reply({
							embeds: [
								new EmbedBuilder({
									color: EmbedColor.danger,
									description: 'It looks like there was an issue with our trivia API. Please try again later.'
								})
							],
							flags: MessageFlags.Ephemeral
						});
					});
			}
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
				flags: MessageFlags.Ephemeral
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
								text: outcome == 0? 'You Won' : outcome == 1? 'You Tied' : 'You Lost'
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

				(interaction.message.components[0] as ActionRow<ButtonComponent>).components
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