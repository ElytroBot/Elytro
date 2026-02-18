import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SlashCommandUserOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import emojis from '../../json/emojis.json';
import { UserModel } from '../../schemas/User';
import { Messages } from '../../structure/Messages';

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
		const user = interaction.options.getUser('user', false) ?? interaction.user;
		const dbUser = await UserModel.findById(user.id);

		if (!dbUser || Array.from(dbUser.inventory.values()).filter(i => i != 0).length == 0) {
			await interaction.reply(Messages.ephemeral(Color.Danger, 'This user has no items.'));
			return;
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: Color.Primary,
					title: `${user.displayName}'s Inventory`,
					description: Array.from(dbUser.inventory.entries())
						.filter(([, value]) => value != 0)
						.map(([key, value]) => `**${emojis[key]} ${key}** - **${value.toLocaleString()}x**`)
						.join('\n')
				})
			]
		});
	}
} satisfies Command;