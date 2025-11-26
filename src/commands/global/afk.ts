import { SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandStringOption, EmbedBuilder, MessageFlags } from 'discord.js';
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

		await UserModel
			.findByIdAndUpdate(interaction.user.id, { afk_status: reason }, { upsert: true })
			.then(() => interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.success,
						description: 'Afk status successfully updated!'
					})
				],
				flags: MessageFlags.Ephemeral
			}));
	}
} satisfies Command;