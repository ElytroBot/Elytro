/* eslint-disable @typescript-eslint/no-var-requires */
import { ChatInputCommandInteraction, EmbedBuilder, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder, SlashCommandStringOption } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';
import fs from 'fs';
import path from 'path';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('toggle')
		.setDescription('Toggles a plugin.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setContexts(InteractionContextType.Guild)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('plugin')
				.setDescription('The plugin you want to toggle.')
				.addChoices(
					{ name: 'Economy', value: 'Economy' },
					{ name: 'Fun', value: 'Fun' },
					{ name: 'Leveling', value: 'Leveling' },
					{ name: 'Moderation', value: 'Moderation' },
					{ name: 'Saluter', value: 'Saluter' },
					{ name: 'Ticketing', value: 'Ticketing' }
				)
				.setRequired(true)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const pluginName = interaction.options.getString('plugin');
		const guild = await GuildModel.findById(interaction.guild.id) ??
			await GuildModel.create({ _id: interaction.guild.id });

		if (guild.plugins.includes(pluginName)) {
			if (fs.existsSync(path.join(__dirname, '..', pluginName))) {
				const commandNames = [];

				fs.readdirSync(path.join(__dirname, '..', pluginName)).forEach(file =>
					commandNames.push(file.split('.')[0]));

				(await interaction.guild.commands.fetch()).forEach(command => {
					if (command.client.application.id == interaction.client.application.id &&
						commandNames.includes(command.name)) {
						interaction.guild.commands.delete(command.id);
					}
				});
			}

			guild.plugins.splice(guild.plugins.indexOf(pluginName), 1);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						description: `The \`${pluginName}\` plugin has been disabled.`
					})
				]
			});
		}
		else {
			if (fs.existsSync(path.join(__dirname, '..', pluginName))) {
				fs.readdirSync(path.join(__dirname, '..', pluginName)).forEach(file => {
					const command = require(path.join(__dirname, '..', pluginName, file));
					interaction.guild.commands.create(command.data);
				});
			}

			guild.plugins.push(pluginName);

			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.primary,
						description: `The \`${pluginName}\` plugin has been enabled.`
					})
				]
			});
		}

		guild.save();
	}
} satisfies Command;