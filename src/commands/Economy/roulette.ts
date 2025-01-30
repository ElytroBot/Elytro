import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roulette')
		.setDescription('Play a game of roulette.')
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName('bet')
				.setDescription('The amount of money you want to bet.')
				.setMinValue(1)
				.setMaxValue(100_000)
				.setRequired(true)
		)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('color')
				.setDescription('The color you want to bet on.')
				.setChoices(
					{ name: 'black', value: 'black' },
					{ name: 'red', value: 'red' }
				)
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = await UserModel.findById(interaction.user.id);
		const bet = interaction.options.getInteger('bet');

		if (!user || user.balance < bet) {
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

		const won = Math.round(Math.random()) == 0;

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Roulette',
					description: `You ${won? 'won' : 'lost'} ${bet.toLocaleString()} ${emojis.coin}!`
				}).setThumbnail('https://cdn-icons-png.flaticon.com/512/3425/3425938.png')
			]
		});

		user.balance += won? bet : -bet;
		user.save();
	}
} satisfies Command;