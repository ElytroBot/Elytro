import { ActionRowBuilder, ApplicationIntegrationType, ButtonBuilder, ChatInputCommandInteraction, EmbedBuilder, InteractionContextType, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { EmbedColor } from '../../structure/EmbedColor';
import jokes from '../../json/jokes.json';
import wyr from '../../json/wyr.json';
import trivia from '../../json/trivia.json';
import { Button } from '../../structure/Button';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bot')
		.setDescription('Commands related to Elytro.')
		.setContexts(
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('info')
				.setDescription('Gives info about Elytro.')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		interaction.reply({
			embeds: [
				new EmbedBuilder({ color: EmbedColor.primary, title: 'Bot Info' }).addFields(
					{
						name: 'Servers',
						value: interaction.client.guilds.cache.size.toLocaleString(),
						inline: true
					},
					{
						name: 'Commands',
						value: interaction.client.commands.length.toString(),
						inline: true
					},
					{
						name: 'Ping',
						value: `${interaction.client.ws.ping}ms`,
						inline: true
					},
					{
						name: 'Jokes',
						value: jokes.length.toString(),
						inline: true
					},
					{
						name: 'Trivia Questions',
						value: trivia.length.toString(),
						inline: true
					},
					{
						name: 'WYR Questions',
						value: wyr.length.toString(),
						inline: true
					}
				)
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					Button.link({
						label: 'Invite',
						url: 'https://discord.com/oauth2/authorize?client_id=904730769929429072&permissions=8&scope=bot'
					}),
					Button.link({
						label: 'Vote',
						url: 'https://top.gg/bot/904730769929429072/vote'
					}),
					Button.link({
						label: 'Review',
						url: 'https://top.gg/bot/904730769929429072#reviews'
					})
				)
			]
		});
	}
} satisfies Command;