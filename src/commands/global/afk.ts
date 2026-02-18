import { SlashCommandBuilder, ChatInputCommandInteraction, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { UserModel } from '../../schemas/User';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('afk')
		.setDescription('Marks you as AFK.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('reason')
				.setDescription('The reason you are going AFK (removes your AFK status if not provided).')
				.setMaxLength(100)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const reason = interaction.options.getString('reason', false);

		await UserModel
			.findByIdAndUpdate(interaction.user.id, { afk_status: reason }, { upsert: true })
			.then(() => interaction.reply(Messages.ephemeral(Color.Success, 'Afk status successfully updated!')));
	}
} satisfies Command;