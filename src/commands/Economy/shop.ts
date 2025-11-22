import { ChatInputCommandInteraction, AutocompleteInteraction, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandSubcommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
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
						.addChoices(shop.map(item => ({ name: item.name, value: item.name })))
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
			case 'view': {
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
			}

			case 'buy': {
				const itemName = interaction.options.getString('item');
				const amount = interaction.options.getInteger('amount', false) ?? 1;
				const item = shop.find(item => item.name == itemName);
				const user = await UserModel.findById(interaction.user.id);

				if (!user || item.price * amount > user.balance) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'You do not have enough money!'
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
							title: 'Buy',
							description: `You bought **${amount}x ${emojis[itemName]} ${itemName}**!`
						})
					]
				});

				user.inventory.set(
					itemName,
					(user.inventory.get(itemName) ?? 0) + amount
				);
				user.balance -= item.price * amount;
				user.save();
				return;
			}

			case 'sell': {
				const itemName = interaction.options.getString('item');
				const amount = interaction.options.getInteger('amount', false) ?? 1;
				const user = await UserModel.findById(interaction.user.id);

				if (!user || (user.inventory.get(itemName) ?? 0) < amount) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'You do not have enough items to sell!'
							})
						],
						flags: MessageFlags.Ephemeral
					});
					return;
				}

				const sellPrice = Math.floor(shop.find(e => e.name == itemName).price * 0.8 * amount);

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Sell',
							description: `You sold **${amount}x ${emojis[itemName]} ${itemName}** for ${sellPrice.toLocaleString()} ${emojis.coin}!`
						})
					]
				});

				user.inventory.set(
					itemName,
					user.inventory.get(itemName) - amount
				);
				user.balance += sellPrice;
				user.save();
			}
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