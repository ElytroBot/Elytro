import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import { ActionRowBuilder, SelectMenuBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from '@discordjs/builders';
import outcomes from '../../json/outcomes.json';
import { UserModel } from '../../schemas/User';

const selectMenu = new StringSelectMenuBuilder()
	.setPlaceholder('Select a place.')
	.setCustomId('place')
	.addOptions(
		new StringSelectMenuOptionBuilder()
			.setLabel('garage')
			.setDescription('Search the garage.')
			.setValue('garage'),
		new StringSelectMenuOptionBuilder()
			.setLabel('car')
			.setDescription('Search your car.')
			.setValue('car'),
		new StringSelectMenuOptionBuilder()
			.setLabel('park')
			.setDescription('Search the park.')
			.setValue('park'),
		new StringSelectMenuOptionBuilder()
			.setLabel('pocket')
			.setDescription('Search your pocket.')
			.setValue('pocket')
	);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('search')
		.setDescription('Search for some extra coins.'),

	async onCommandInteraction(interaction) {
		const user = await UserModel.findById(interaction.user.id) ??
			await UserModel.create({ _id: interaction.user.id });
		const now = Math.floor(Date.now() / 1000);

		if (user.cooldowns.get('search') > now) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You are on cooldown! Come back <t:${user.cooldowns.get('search')}:R>`
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Search',
					description: 'Select a place to search.'
				})
			],
			components: [
				new ActionRowBuilder<SelectMenuBuilder>().addComponents(
					selectMenu.setDisabled(false)
				)
			]
		});

		user.cooldowns.set('search', Math.floor(Date.now() / 1000) + 30);
		user.save();
	},

	async onSelectMenuInteraction(interaction) {
		if (interaction.user.id != interaction.message.interaction.user.id) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You are not allowed to use this select menu!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		interaction.message.edit({
			components: [
				new ActionRowBuilder<SelectMenuBuilder>().addComponents(
					selectMenu.setDisabled(true)
				)
			]
		});

		const random = Math.round(Math.random() * 100);

		if (random > 60) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						title: 'Search',
						description: outcomes.search.fail[Math.floor(
							Math.random() * outcomes.search.fail.length
						)]
					})
				]
			});
			return;
		}

		const user = await UserModel.findById(interaction.user.id);
		const money = Math.round(Math.random() * 500 + 500);

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Search',
					description: outcomes.search.success[Math.floor(
						Math.random() * outcomes.search.success.length
					)].replace('{money}', `${money.toLocaleString()} ${emojis.coin}`)
				})
			]
		});

		user.balance += money;
		user.save();
	}
} satisfies Command;