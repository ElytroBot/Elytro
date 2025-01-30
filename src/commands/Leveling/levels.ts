import { SlashCommandBuilder, Guild, ActionRowBuilder, ButtonBuilder, ButtonInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import { GuildModel, getLevel } from '../../schemas/Guild';
import { Button } from '../../structure/Button';
import emojis from '../../json/emojis.json';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('levels')
		.setDescription('Shows you the levels leaderboard.'),

	async onCommandInteraction(interaction) {
		interaction.reply({
			embeds: [await getEmbed(1, interaction.guild)],
			components: [await getActionRow(1, interaction.guild)]
		});
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		const page = Number(interaction.customId);

		interaction.update({
			embeds: [await getEmbed(page, interaction.guild)],
			components: [await getActionRow(page, interaction.guild)]
		});
	}
} satisfies Command;

async function getEmbed(page: number, guild: Guild) {
	const dbGuild = await GuildModel.findById(guild.id);
	const array = [...dbGuild.xp.entries()];
	array.sort((a, b) => b[1] - a[1]);

	let description = '';
	for (let i = (page - 1) * 10; i < page * 10 && i < array.length; i++) {
		try {
			const member = await guild.members.fetch(array[i][0]);
			description += `${i + 1}. \`\`${member.displayName}\`\` - ${getLevel(array[i][1])}\n`;
		}
		catch {
			array.splice(i, 1);
			i--;
			continue;
		}
	}

	dbGuild.xp = new Map(array);
	dbGuild.save();

	const pageCount = (array.length / 10 < 5)? Math.ceil(array.length / 10) : 5;

	return new EmbedBuilder({
		color: EmbedColor.primary,
		title: 'Levels',
		description: description,
		footer: {
			text: `Page ${page}/${pageCount}`
		}
	});
}

async function getActionRow(page: number, guild: Guild) {
	const dbGuild = await GuildModel.findById(guild.id);

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
			disabled: page == 5 || dbGuild.xp.size <= page * 10
		})
	);
}