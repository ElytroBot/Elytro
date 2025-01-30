import { ApplicationCommandOptionBase, ApplicationIntegrationType, EmbedBuilder, InteractionContextType, SlashCommandBuilder, SlashCommandSubcommandBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import fs from 'fs';
import path from 'path';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';

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

		fs.readdirSync(path.join(__dirname, '..')).forEach(folder => {
			if (!folders.includes(folder)) return;

			const folderPath = path.join(path.join(__dirname, '..'), folder);
		
			fs.readdirSync(folderPath).forEach(async file => {
				const data = (await import(path.join(folderPath, file)) as Command).data;

				if (!(data instanceof SlashCommandBuilder)) return;

				if (data.options.every(option => !(option instanceof SlashCommandSubcommandBuilder))) {
					description += `\`/${data.name}${data.options.map(subcommandOption => ` ${stringifyOption(subcommandOption as ApplicationCommandOptionBase)}`).join('')}\`: ${data.description}\n`;
				}
				else {
					for (const option of data.options) {
						description += `\`/${data.name} ${stringifyOption(option as ApplicationCommandOptionBase)}\n`;
					}
				}
			});
		});

		interaction.reply({
			embeds: [
				new EmbedBuilder({
					color: EmbedColor.primary,
					title: 'Help',
					description: description
				})
			],
			ephemeral: true
		});
	}
} satisfies Command;

function stringifyOption(option: ApplicationCommandOptionBase) {
	if (option instanceof SlashCommandSubcommandBuilder)
		return `${option.name}${option.options.map(subcommandOption => ` ${stringifyOption(subcommandOption)}`).join('')}\`: ${option.description}`;
	
	return `<${option.name}${!option.required? ': optional' : ''}>`;
}