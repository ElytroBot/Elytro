import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder } from 'discord.js';
import { EmbedColor } from '../../structure/EmbedColor';
import { Command } from '../../structure/Command';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Pings Elytro.')
		.setContexts(
			InteractionContextType.BotDM,
			InteractionContextType.Guild,
			InteractionContextType.PrivateChannel
		)
		.setIntegrationTypes(
			ApplicationIntegrationType.GuildInstall,
			ApplicationIntegrationType.UserInstall
		),

	async onCommandInteraction(interaction) {
		interaction.reply({
			embeds: [
				new EmbedBuilder({ color: EmbedColor.primary, title: 'Ping' }).addFields(
					{
						name: 'Bot Ping',
						value: `${interaction.client.ws.ping}ms`,
						inline: true
					},
					{
						name: 'Up since',
						value: `<t:${Math.floor((Date.now() - interaction.client.uptime) / 1000)}:R>`
					}
				)
			]
		});
	}
} satisfies Command;