import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('joke')
		.setDescription('Tells you a joke.'),

	async onCommandInteraction(interaction) {
		fetch('https://v2.jokeapi.dev/joke/Miscellaneous,Dark,Pun,Spooky,Christmas?blacklistFlags=nsfw,religious,political,racist,sexist,explicit')
			.then(res => res.json())
			.then(json => {
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Joke',
							description: json.type == 'single'? json.joke : `${json.setup}\n${json.delivery}`,
							footer: { text: 'Powered by jokeapi.dev' }
						})
					]
				});
			})
			.catch(() => {
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'It looks like there was an issue with our joke API. Please try again later.'
						})
					],
					ephemeral: true
				});
			});
	}
} satisfies Command;