import { ActionRowBuilder, APIApplicationCommandBasicOption as BasicOption, ApplicationCommandOption, ApplicationCommandOptionType, ApplicationIntegrationType, ButtonBuilder, ContainerBuilder, InteractionContextType, MessageFlags, SeparatorBuilder, SlashCommandBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import fs from 'fs';
import path from 'path';
import { GuildModel } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';
import emojis from '../../json/emojis.json';

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
		await interaction.reply(await paginate(1, interaction.guildId, ['global']));
	},

	async onButtonInteraction(interaction) {
		const page = Number(interaction.customId.split(':')[1]);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const selected = (interaction.message.components[0] as any).components[3].components[0].options
			.filter(o => o.default).map(o => o.value);

		await interaction.update(await paginate(page, interaction.guildId, selected));
	},

	async onSelectMenuInteraction(interaction) {
		await interaction.update(await paginate(1, interaction.guildId, interaction.values));
	}
} satisfies Command;

async function paginate(page: number, guildId: string, selected: string[]) {
	const plugins = guildId ? await GuildModel.findById(guildId)
		.then(doc => doc?.plugins ?? [])
		.then(plugins => plugins.filter(p => fs.existsSync(path.resolve('src', 'commands', p))))
		: [];
	let commands = [];

	for (const plugin of selected) {
		if (!['global', ...plugins].includes(plugin)) continue;

		for (const file of fs.readdirSync(path.resolve('src', 'commands', plugin))) {
			const command = (await import(`../${plugin}/${file}`)).default.data;

			if (command instanceof SlashCommandBuilder) commands.push(command);
		}
	}

	commands = commands
		.sort((a, b) => a.name.localeCompare(b.name))
		.map(formatCommand)
		.flat();

	return {
		components: [
			new ContainerBuilder({
				accent_color: EmbedColor.primary,
				components: [
					new TextDisplayBuilder({
						content: `### Help\n${commands.slice((page - 1) * 5, page * 5).join('\n\n')}`
					}).toJSON(),
					new SeparatorBuilder().toJSON(),
					new TextDisplayBuilder({
						content: `-# Page ${page}/${Math.ceil(commands.length / 5)}`
					}).toJSON(),
					new ActionRowBuilder<StringSelectMenuBuilder>({
						components: [
							new StringSelectMenuBuilder({
								custom_id: 'help',
								placeholder: 'Select plugins...',
								options: [
									{
										label: 'Global',
										value: 'global',
										default: selected.includes('global')
									},
									...plugins.map(plugin => ({
										label: plugin,
										value: plugin,
										default: selected.includes(plugin)
									}))
								],
								max_values: plugins.length + 1,
								min_values: 1
							})
						]
					}).toJSON(),
					new ActionRowBuilder<ButtonBuilder>({
						components: [
							Button.primary({
								custom_id: `help:${page - 1}`,
								emoji: emojis.back,
								disabled: page == 1
							}),
							Button.primary({
								custom_id: `help:${page + 1}`,
								emoji: emojis.forward,
								disabled: page == Math.ceil(commands.length / 5)
							})
						]
					}).toJSON()
				]
			}),
			new ActionRowBuilder<ButtonBuilder>({
				components: [
					Button.link({
						label: 'Server',
						url: 'https://discord.gg/KCY2RERtxk'
					}),
					Button.link({
						label: 'Website',
						url: 'https://elytro-bot.vercel.app'
					})
				]
			})
		],
		flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
	};
}

function formatCommand(command: SlashCommandBuilder) {
	const options = command.options.map(o => o.toJSON());

	if (options[0]?.type == 1)
		return options.map(o => `**/${command.name}** ${formatOption(o)[0]}`);
	else if (options[0]?.type == 2) {
		return options
			.map(o => formatOption(o).map(s => `**/${command.name}** ${s}`))
			.flat();
	}
	return [`**/${command.name}**${formatBasicOptions(options as BasicOption[])}\n${command.description}`];
}

function formatOption(option: ApplicationCommandOption): string[] {
	if (option.type == ApplicationCommandOptionType.Subcommand)
		return [`**${option.name}**${formatBasicOptions(option.options as BasicOption[])}\n${option.description}`];
	else if (option.type == ApplicationCommandOptionType.SubcommandGroup)
		return option.options.map(o => `**${option.name}** ${formatOption(o)[0]}`);
	return [` \`${option.name}\``];
}

function formatBasicOptions(options: BasicOption[]) {
	let result = options
		.filter(o => o.required)
		.map(o => formatOption(o)[0])
		.join('');

	if (options.find(o => !o.required)) {
		result += ' |' + options
			.filter(o => !o.required)
			.map(o => formatOption(o)[0])
			.join('');
	}

	return result;
}