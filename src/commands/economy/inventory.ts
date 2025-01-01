import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('inventory')
		.setDescription('View a user\'s inventory.')
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user\'s inventory you want to view.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = interaction.options.getUser('user', false);
		const dbUser = await UserModel.findById((user ?? interaction.user).id);

		if (!dbUser || Array
			.from(dbUser.inventory.values())
			.filter(item => item != 0).length == 0) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'This user has no items.'
					})
				],
				ephemeral: true
			});
			return;
		}

		let description = '';
		dbUser.inventory.forEach((value: number, key: string) => {
			if (value != 0) {
				description += `**${emojis[key]} ${key}** - **${value.toLocaleString()}x**\n`;
			}
		});

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: `${(user ?? interaction.user).displayName}'s Inventory`,
					description: description
				})
			]
		});
	}
} satisfies Command;