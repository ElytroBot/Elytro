import { SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandStringOption, EmbedBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { UserModel } from '../../schemas/User';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('afk')
		.setDescription('Marks you as AFK.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('reason')
				.setDescription('The reason you are going AFK (removes your AFK status if not provided).')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const reason = interaction.options.getString('reason', false);
		const user = await UserModel.findById(interaction.user.id);

		if (!reason) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.success,
						description: 'Afk status successfully removed!'
					})
				],
				ephemeral: true
			});
	
			user.afk_status = undefined;
			user.save();
			return;
		}

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.success,
					description: 'Afk status successfully updated!'
				})
			],
			ephemeral: true
		});

		user.afk_status = reason;
		user.save();
	}
} satisfies Command;