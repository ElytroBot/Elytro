import { ActionRowBuilder, ApplicationCommandOptionBase, ApplicationIntegrationType, ButtonBuilder, EmbedBuilder, InteractionContextType, MessageFlags, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import fs from 'fs';
import path from 'path';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Provides help information.')
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
		const dbGuild = await GuildModel.findById(interaction.guild?.id);
		const folders = ['global', ...(dbGuild? dbGuild.plugins : [])];
		let description = '';

		for (const folder of fs.readdirSync(path.resolve('src', 'commands'))) {
			if (!folders.includes(folder)) continue;

			const folderPath = path.resolve('src', 'commands', folder);

			for (const file of fs.readdirSync(folderPath)) {
				const data = (await import(`../${folder}/${file}`)).default.data;

				if (!(data instanceof SlashCommandBuilder)) continue;

				if (data.options.every(option => !(option instanceof SlashCommandSubcommandBuilder))) {
					description += `\`/${data.name}${data.options.map(subcommandOption => ` ${stringifyOption(subcommandOption as ApplicationCommandOptionBase)}`).join('')}\`: ${data.description}\n`;
				}
				else {
					for (const option of data.options) {
						description += `\`/${data.name} ${stringifyOption(option as ApplicationCommandOptionBase)}\n`;
					}
				}
			}
		}

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Help',
					description: description
				})
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					Button.link({
						label: 'Server',
						url: 'https://discord.gg/KCY2RERtxk'
					}),
					Button.link({
						label: 'Website',
						url: 'https://elytro-bot.vercel.app'
					})
				)
			],
			flags: MessageFlags.Ephemeral
		});
	}
} satisfies Command;

function stringifyOption(option: ApplicationCommandOptionBase) {
	if (option instanceof SlashCommandSubcommandBuilder)
		return `${option.name}${option.options.map(subcommandOption => ` ${stringifyOption(subcommandOption)}`).join('')}\`: ${option.description}`;
	
	return `<${option.name}${!option.required? ': optional' : ''}>`;
}