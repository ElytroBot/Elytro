import { ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { transfer, UserModel } from '../../schemas/User';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('give')
		.setDescription('Gives money to a specified user.')
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user to give the money to.')
				.setRequired(true)
		)
		.addIntegerOption(
			new SlashCommandIntegerOption()
				.setName('amount')
				.setDescription('The amount to give.')
				.setMinValue(1)
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const receiver = interaction.options.getUser('user');

		if (receiver.bot) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You cannot give money to a bot!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		if (interaction.user.id == receiver.id) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You cannot give money to yourself!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const dbUser = await UserModel.findById(interaction.user.id);
		const amount = interaction.options.getInteger('amount');

		if (!dbUser || dbUser.balance < amount) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'You do not have this much money!'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const dbReceiver = await UserModel.findById(receiver.id) ??
			await UserModel.create({ _id: receiver.id });

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.success,
					description: `You gave ${receiver} ${transfer(dbUser, dbReceiver, amount).toLocaleString()} ${emojis.coin}.`
				})
			]
		});

		receiver.send({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Donation Alert',
					description: `${interaction.user} just gave you ${amount.toLocaleString()} ${emojis.coin}!`
				})
			]
		});

		dbReceiver.save();
		dbUser.save();
	}
} satisfies Command;