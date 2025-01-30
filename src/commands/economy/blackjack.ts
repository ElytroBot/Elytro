import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, SlashCommandIntegerOption, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandSubcommandBuilder()
		.setName('blackjack')
		.setDescription('Play blackjack with the bot.')
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName('bet')
				.setDescription('The amount of money you want to bet.')
				.setMinValue(1_000)
				.setMaxValue(100_000)
				.setRequired(true)
		),
	
	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = await UserModel.findById(interaction.user.id);

		if (user.cooldowns.get('blackjack') == 1) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'Please finish your previous game of blackjack.'
					})
				],
				ephemeral: true
			});
			return;
		}
		else if (user.balance < interaction.options.getInteger('bet')) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You cannot bet more money than you own.'
					})
				],
				ephemeral: true
			});
			return;
		}

		const bet = interaction.options.getInteger('bet').toLocaleString();
		const deck = await fetch('https://www.deckofcardsapi.com/api/deck/new/shuffle/?deck_count=6')
			.then(res => res.json());
		const cards = await fetch(`https://www.deckofcardsapi.com/api/deck/${deck.deck_id}/draw/?count=4`)
			.then(res => res.json())
			.then(json => json.cards.map(card => stringifyCard(card)));
		const playerDeck = cards.slice(2).join(' ');
		const dealerDeck = cards.slice(0, 2).join(' ');

		if (calculateScore(playerDeck) == 21 && calculateScore(dealerDeck) == 21) {
			interaction.reply({
				embeds: [
					generateEmbed(bet, dealerDeck, playerDeck, true)
						.setColor('White')
						.setFooter({ text: 'You and the Dealer hit Blackjack' })
				],
				components: []
			});
			return;
		}
		else if (calculateScore(playerDeck) == 21) {
			interaction.reply({
				embeds: [
					generateEmbed(bet, dealerDeck, playerDeck, true)
						.setColor(EmbedColor.success)
						.setFooter({ text: 'You hit Blackjack!' })
				],
				components: []
			});

			user.balance += Math.round(parseInt(bet.replace(',', '')) * 1.5);
			user.save();
			return;
		}
		else if (calculateScore(dealerDeck) == 21) {
			interaction.reply({
				embeds: [
					generateEmbed(bet, dealerDeck, playerDeck, true)
						.setColor(EmbedColor.danger)
						.setFooter({ text: 'Dealer hit Blackjack' })
				],
				components: []
			});

			user.balance -= parseInt(bet.replace(',', ''));
			user.save();
			return;
		}

		interaction.reply({
			embeds: [generateEmbed(bet, `${cards[0]} 🃏`, playerDeck)],
			components: [
				new ActionRowBuilder<Button>().addComponents(
					Button.primary({
						custom_id: `blackjack|hit|${bet}|${deck.deck_id}|${cards[1]}`,
						label: 'Hit'
					}),
					Button.primary({
						custom_id: `blackjack|stand|${bet}|${deck.deck_id}|${cards[1]}`,
						label: 'Stand'
					})
				),
				new ActionRowBuilder<Button>().addComponents(
					Button.primary({
						custom_id: `blackjack|dd|${bet}|${deck.deck_id}|${cards[1]}`,
						label: 'Double Down'
					}),
					Button.danger({
						custom_id: `blackjack|surrender|${bet}|${deck.deck_id}|${cards[1]}`,
						label: 'Surrender'
					})
				)
			]
		});
		user.cooldowns.set('blackjack', 1);
		user.save();
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		if (interaction.user.id != interaction.message.interactionMetadata.user.id) {
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

		const segments = interaction.customId.split('|');

		switch (segments[1]) {
			case 'hit': {
				const user = await UserModel.findById(interaction.user.id);
				const card = await fetch(`https://www.deckofcardsapi.com/api/deck/${segments[3]}/draw/?count=1`)
					.then(res => res.json())
					.then(json => stringifyCard(json.cards[0]));
				const playerDeck = `${interaction.message.embeds[0].fields[1].value} ${card}`;

				if (calculateScore(playerDeck) > 21) {
					interaction.update({
						embeds: [
							generateEmbed(
								segments[2],
								`${interaction.message.embeds[0].fields[0].value.split(' ')[0]} ${segments[4]}`,
								playerDeck,
								true
							)
								.setColor(EmbedColor.danger)
								.setFooter({ text: 'You Busted' })
						],
						components: []
					});

					user.balance -= Math.round(parseInt(segments[2].replace(',', '')));
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}

				interaction.update({
					embeds: [
						generateEmbed(
							segments[2],
							interaction.message.embeds[0].fields[0].value,
							playerDeck
						)
					],
					components: [
						new ActionRowBuilder<Button>().addComponents(
							Button.primary({
								custom_id: `blackjack|hit|${segments[2]}|${segments[3]}|${segments[4]}`,
								label: 'Hit'
							}),
							Button.primary({
								custom_id: `blackjack|stand|${segments[2]}|${segments[3]}|${segments[4]}`,
								label: 'Stand'
							})
						),
						new ActionRowBuilder<Button>().addComponents(
							Button.primary({
								custom_id: `blackjack|dd|${segments[2]}|${segments[3]}|${segments[4]}`,
								label: 'Double Down',
								disabled: true
							}),
							Button.danger({
								custom_id: 'blackjack|surrender',
								label: 'Surrender',
								disabled: true
							})
						)
					]
				});
				return;
			}

			case 'stand': {
				const user = await UserModel.findById(interaction.user.id);
				const playerDeck = interaction.message.embeds[0].fields[1].value;
				const dealerDeck = await playDealer(
					`${interaction.message.embeds[0].fields[0].value.split(' ')[0]} ${segments[4]}`,
					segments[3]
				);

				if (calculateScore(dealerDeck) > 21) {
					interaction.update({
						embeds: [
							generateEmbed(segments[2], dealerDeck, playerDeck, true)
								.setColor(EmbedColor.success)
								.setFooter({ text: 'Dealer Busted' })
						],
						components: []
					});

					user.balance += parseInt(segments[2].replace(',', ''));
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}
				else if (calculateScore(dealerDeck) < calculateScore(playerDeck)) {
					interaction.update({
						embeds: [
							generateEmbed(segments[2], dealerDeck, playerDeck, true)
								.setColor(EmbedColor.success)
								.setFooter({ text: 'You Won' })
						],
						components: []
					});

					user.balance += parseInt(segments[2].replace(',', ''));
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}
				else if (calculateScore(dealerDeck) == calculateScore(playerDeck)) {
					interaction.update({
						embeds: [
							generateEmbed(segments[2], dealerDeck, playerDeck, true)
								.setColor('White')
								.setFooter({ text: 'You Pushed' })
						],
						components: []
					});
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}

				interaction.update({
					embeds: [
						generateEmbed(segments[2], dealerDeck, playerDeck, true)
							.setColor(EmbedColor.danger)
							.setFooter({ text: 'You Lost' })
					],
					components: []
				});

				user.balance -= parseInt(segments[2].replace(',', ''));
				user.cooldowns.set('blackjack', 0);
				user.save();
				return;
			}

			case 'dd': {
				const user = await UserModel.findById(interaction.user.id);
				const card = await fetch(`https://www.deckofcardsapi.com/api/deck/${segments[3]}/draw/?count=1`)
					.then(res => res.json())
					.then(json => stringifyCard(json.cards[0]));
				const playerDeck = `${interaction.message.embeds[0].fields[1].value} ${card}`;
				let dealerDeck = interaction.message.embeds[0].fields[0].value;

				if (calculateScore(playerDeck) > 21) {
					interaction.update({
						embeds: [
							generateEmbed(
								segments[2],
								`${interaction.message.embeds[0].fields[0].value.split(' ')[0]} ${segments[4]}`,
								playerDeck,
								true
							)
								.setColor(EmbedColor.danger)
								.setFooter({ text: 'You Busted' })
						],
						components: []
					});

					user.balance -= Math.round(parseInt(segments[2].replace(',', '')));
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}

				dealerDeck = await playDealer(
					`${interaction.message.embeds[0].fields[0].value.split(' ')[0]} ${segments[4]}`,
					segments[3]
				);

				if (calculateScore(dealerDeck) > 21) {
					interaction.update({
						embeds: [
							generateEmbed(segments[2], dealerDeck, playerDeck, true)
								.setColor(EmbedColor.success)
								.setFooter({ text: 'Dealer Busted' })
						],
						components: []
					});

					user.balance += parseInt(segments[2].replace(',', '')) * 2;
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}
				else if (calculateScore(dealerDeck) < calculateScore(playerDeck)) {
					interaction.update({
						embeds: [
							generateEmbed(segments[2], dealerDeck, playerDeck, true)
								.setColor(EmbedColor.success)
								.setFooter({ text: 'You Won' })
						],
						components: []
					});

					user.balance += parseInt(segments[2].replace(',', '')) * 2;
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}
				else if (calculateScore(dealerDeck) == calculateScore(playerDeck)) {
					interaction.update({
						embeds: [
							generateEmbed(segments[2], dealerDeck, playerDeck, true)
								.setColor('White')
								.setFooter({ text: 'You Pushed' })
						],
						components: []
					});
					user.cooldowns.set('blackjack', 0);
					user.save();
					return;
				}

				interaction.update({
					embeds: [
						generateEmbed(segments[2], dealerDeck, playerDeck, true)
							.setColor(EmbedColor.danger)
							.setFooter({ text: 'You Lost' })
					],
					components: []
				});

				user.balance -= parseInt(segments[2].replace(',', ''));
				user.cooldowns.set('blackjack', 0);
				user.save();
				return;
			}

			default: {
				const user = await UserModel.findById(interaction.user.id);
				user.balance -= Math.round(parseInt(segments[2].replace(',', '')) / 2);
				user.cooldowns.set('blackjack', 0);
				user.save();

				interaction.update({
					embeds: [
						generateEmbed(
							segments[2],
							`${interaction.message.embeds[0].fields[0].value.split(' ')[0]} ${segments[4]}`,
							interaction.message.embeds[0].fields[1].value,
							true
						)
							.setColor(EmbedColor.danger)
							.setFooter({ text: 'You Surrendered' })
					],
					components: []
				});
			}
		}
	}
} satisfies Command;

function stringifyCard(card) {
	if (['A', 'J', 'Q', 'K'].includes(card.value.charAt(0)))
		return `:${card.suit.toLowerCase()}:${card.value.charAt(0)}`;

	return `:${card.suit.toLowerCase()}:${card.value}`;
}

function calculateScore(cards: string) {
	let score = 0;
	let aceCount = 0;

	for (const card of cards.split(' ')) {
		const value = card.split(':')[2];

		if (value == 'A') {
			++score;
			++aceCount;
		}
		else if (isNaN(parseInt(value))) score += 10;
		else score += parseInt(value);
	}

	if (score <= 11 && aceCount > 0)
		score += Math.min(Math.floor((21 - score) / 10), aceCount) * 10;
	return score;
}

async function playDealer(dealerDeck, deckId) {
	while (calculateScore(dealerDeck) < 17) {
		dealerDeck += ' ' + await fetch(`https://www.deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
			.then(res => res.json())
			.then(json => stringifyCard(json.cards[0]));
	}

	return dealerDeck;
}

function generateEmbed(bet: string, dealerCards: string, playerCards: string, dealerScore?: true) {
	return new EmbedBuilder({
		color: EmbedColor.primary,
		title: 'Blackjack',
		description: `Bet: ${bet} ${emojis.coin}`,
		fields:[
			{ name: `Dealer (${dealerScore? calculateScore(dealerCards) : '?'})`, value: dealerCards },
			{ name: `You (${calculateScore(playerCards)})`, value: playerCards }
		]
	});
}