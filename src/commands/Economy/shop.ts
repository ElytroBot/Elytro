import { ChatInputCommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, EmbedBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import shop from '../../json/shop.json';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('shop')
		.setDescription('Commands related to the shop.')
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('view')
				.setDescription('View the items in the shop.')
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('buy')
				.setDescription('Buys an item from the shop.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('item')
						.setDescription('The item you want to buy.')
						.addChoices(
							{ name: 'Lock', value: 'Lock' },
							{ name: 'Lockpick', value: 'Lockpick' },
							{ name: 'Security Camera', value: 'Security Camera' },
							{ name: 'Shovel', value: 'Shovel' }
						)
						.setRequired(true)
				)
				.addIntegerOption(
					new SlashCommandIntegerOption()
						.setName('amount')
						.setDescription('The number of items you want to buy.')
						.setMinValue(1)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('sell')
				.setDescription('Sell an item in your inventory.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('item')
						.setDescription('The item you want to sell.')
						.setAutocomplete(true)
						.setRequired(true)
				)
				.addIntegerOption(
					new SlashCommandIntegerOption()
						.setName('amount')
						.setDescription('The number of items you want to sell (defaults to 1).')
						.setMinValue(1)
				)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		switch (interaction.options.getSubcommand()) {
			case 'view':
				let description = '';
				shop.forEach(item =>
					description += `**${emojis[item.name]} ${item.name}** - ${item.price.toLocaleString()} ${emojis.coin}\n`
				);

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Shop',
							description: description
						})
					]
				});
				return;

			case 'buy':
				const buyItemName = interaction.options.getString('item');
				const buyAmount = interaction.options.getInteger('amount', false) ?? 1;
				const buyItem = shop.find(item => item.name == buyItemName);
				const buyUser = await UserModel.findById(interaction.user.id);

				if (!buyUser || buyItem.price * buyAmount > buyUser.balance) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'You do not have enough money!'
							})
						],
						ephemeral: true
					});
					return;
				}

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Buy',
							description: `You bought **${buyAmount}x ${emojis[buyItemName]} ${buyItemName}**!`
						})
					]
				});

				buyUser.inventory.set(
					buyItemName,
					(buyUser.inventory.get(buyItemName) ?? 0) + buyAmount
				);
				buyUser.balance -= buyItem.price * buyAmount;
				buyUser.save();
				return;

			case 'sell':
				const sellItem = interaction.options.getString('item');
				const sellAmount = interaction.options.getInteger('amount', false) ?? 1;
				const sellUser = await UserModel.findById(interaction.user.id);

				if (!sellUser || (sellUser.inventory.get(sellItem) ?? 0) < sellAmount) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'You do not have enough items to sell!'
							})
						],
						ephemeral: true
					});
					return;
				}

				const sellPrice = Math.floor(
					shop.find(item => item.name == sellItem).price * 0.75 * sellAmount
				);

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Sell',
							description: `You sold **${sellAmount}x ${emojis[sellItem]} ${sellItem}** for ${sellPrice.toLocaleString()} ${emojis.coin}!`
						})
					]
				});

				sellUser.inventory.set(
					sellItem,
					sellUser.inventory.get(sellItem) - sellAmount
				);
				sellUser.balance += sellPrice;
				sellUser.save();
		}
	},

	async onAutocompleteInteraction(interaction: AutocompleteInteraction) {
		const user = await UserModel.findById(interaction.user.id);
		const option = interaction.options.getFocused(true);
        
		if (!user) {
			interaction.respond([]);
			return;
		}

		const results = Array.from(user.inventory.entries())
			.filter(([, quantity]) => quantity > 0)
			.map(([item]) => item)
			.filter(item => item.toLowerCase().includes(option.value.toLowerCase()))
			.map(item => ({ name: item, value: item }));

		interaction.respond(results);
	}
} satisfies Command;