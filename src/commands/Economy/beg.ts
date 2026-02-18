import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import emojis from '../../json/emojis.json';
import outcomes from '../../json/outcomes.json';
import { UserModel } from '../../schemas/User';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('beg')
		.setDescription('Beg for some extra coins.'),

	async onCommandInteraction(interaction) {
		const user = await UserModel.findById(interaction.user.id)
			?? await UserModel.create({ _id: interaction.user.id });
		const now = Math.floor(Date.now() / 1000);

		if (user.cooldowns.get('beg') > now) {
			interaction.reply(Messages.cooldown(user.cooldowns.get('beg')));
			return;
		}

		if (Math.round(Math.random()) == 0) {
			const money = Math.round(Math.random() * 200 + 300);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: Color.Primary,
						title: 'Beg',
						description: outcomes.beg.success[
							Math.floor(Math.random() * outcomes.beg.success.length)
						].replace('{money}', `${money} ${emojis.coin}`)
					})
				]
			});
			user.balance += money;
		}
		else {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: Color.Primary,
						title: 'Beg',
						description: outcomes.beg.fail[Math.floor(Math.random() * outcomes.beg.fail.length)]
					})
				]
			});
		}

		user.cooldowns.set('beg', now + 30);
		user.save();
	}
} satisfies Command;