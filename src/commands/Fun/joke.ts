import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joke')
		.setDescription('Tells you a joke.'),

	async onCommandInteraction(interaction) {
		await fetch('https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun,Spooky,Christmas?blacklistFlags=nsfw,religious,political,racist,sexist,explicit')
			.then(res => res.json())
			.then(
				json => interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: Color.Primary,
							title: 'Joke',
							description: json.type == 'single' ? json.joke : `${json.setup}\n${json.delivery}`,
							footer: { text: 'Powered by jokeapi.dev' }
						})
					]
				}),
				() => interaction.reply(Messages.ephemeral(Color.Danger, 'It looks like there was an issue with our joke API. Please try again later.'))
			);
	}
} satisfies Command;