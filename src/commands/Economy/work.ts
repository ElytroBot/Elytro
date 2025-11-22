import { ActionRowBuilder, ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import { Button } from '../../structure/Button';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('work')
		.setDescription('Work for some extra coins.'),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const dbUser = await UserModel.findById(interaction.user.id) ??
			await UserModel.create({ _id: interaction.user.id });
		const now = Math.floor(Date.now() / 1000);

		if (dbUser.cooldowns.get('work') > now) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: `You are on cooldown! Come back <t:${dbUser.cooldowns.get('work')}:R>`
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const colors = ['red', 'orange', 'yellow', 'green', 'blue'];
		const shapes = ['square', 'heart', 'circle'];
		const emojis = [];

		for (const shape of shapes) {
			const random = Math.floor(Math.random() * colors.length);
			emojis.push(`${colors[random]}_${shape}`);
			colors.splice(random, 1);
		}

		let sequence = '';
		emojis.forEach(emoji => sequence += `:${emoji}: `);

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Work',
					description: `Remember the colors of the following shapes.\n\n${sequence}`
				})
			]
		});

		const emoji = emojis[Math.floor(Math.random() * emojis.length)];
		setTimeout(() => showButtons(interaction, emoji), 2500);

		dbUser.cooldowns.set('work', now + 1800);
		dbUser.save();
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

		const dbUser = await UserModel.findById(interaction.user.id);
		const segments = interaction.customId.split('|');

		if (segments[0] == segments[1]) {
			const money = Math.round(Math.random() * 2000 + 6000);

			interaction.message.edit({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.success,
						title: 'Correct',
						description: `Good job! You earned ${money.toLocaleString()} ${emojis.coin} for your work.`
					})
				],
				components: []
			});
			dbUser.balance += money;
		}
		else {
			const money = Math.round(Math.random() * 2000 + 4000);

			interaction.message.edit({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						title: 'Incorrect',
						description: `Terrible job. You earned ${money.toLocaleString()} ${emojis.coin} for your work.`
					})
				],
				components: []
			});
			dbUser.balance += money;
		}
		
		dbUser.save();
	}
} satisfies Command;

function showButtons(interaction: ChatInputCommandInteraction, emoji: string) {
	const colors = ['red', 'orange', 'yellow', 'green', 'blue'];
	const shape = emoji.split('_')[1];

	const actionRow = new ActionRowBuilder<Button>();
	colors.forEach(color => {
		actionRow.addComponents(
			Button.secondary({
				custom_id: `${color}|${emoji.split('_')[0]}`,
				emoji: emojis[`${color}_${shape}`]
			})
		);
	});

	interaction.editReply({
		embeds: [
			new EmbedBuilder({
				color: EmbedColor.primary,
				title: 'Work',
				description: `What color was the ${shape}?`
			})
		],
		components: [actionRow]
	});
}