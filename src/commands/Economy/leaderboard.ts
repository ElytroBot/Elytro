import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, Client, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import { Button } from '../../structure/Button';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows you the economy leaderboard.'),

	async onCommandInteraction(interaction) {
		interaction.reply({
			embeds: [await getEmbed(1, interaction.client)],
			components: [await getActionRow(1)]
		});
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		const page = Number(interaction.customId);

		interaction.update({
			embeds: [await getEmbed(page, interaction.client)],
			components: [await getActionRow(page)]
		});
	}
} satisfies Command;

async function getEmbed(page: number, client: Client) {
	const dbUsers = await UserModel.find().sort({ balance: -1 })
		.limit(10 * page);

	let description = '';
	for (const [index, dbUser] of dbUsers.entries()) {
		if (index < (page - 1) * 10) continue;
		const user = await client.users.fetch(dbUser.id);
		description += `${index + 1}. \`\`${user.displayName}\`\` - ${dbUser.balance.toLocaleString()} ${emojis.coin}\n`;
	}

	const userCount = await UserModel.countDocuments();
	const pageCount = (userCount / 10 < 5)? Math.ceil(userCount / 10) : 5;

	return new EmbedBuilder({
		color: EmbedColor.primary,
		title: 'Leaderboard',
		description: description,
		footer: { text: `Page ${page}/${pageCount}` }
	});
}

async function getActionRow(page: number) {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		Button.primary({
			custom_id: String(page - 1),
			emoji: emojis.back,
			disabled: page - 1 == 0
		}),
		Button.primary({
			custom_id: String(page),
			emoji: emojis.refresh
		}),
		Button.primary({
			custom_id: String(page + 1),
			emoji: emojis.forward,
			disabled: page == 5 || await UserModel.countDocuments() <= page * 10
		})
	);
}