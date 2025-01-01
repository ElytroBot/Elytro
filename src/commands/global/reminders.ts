import { ChatInputCommandInteraction, ButtonInteraction, ActionRowBuilder, ButtonBuilder, SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandStringOption, InteractionContextType, ApplicationIntegrationType, EmbedBuilder } from 'discord.js';
import { EmbedColor } from '../../structure/EmbedColor';
import { Button } from '../../structure/Button';
import { UserModel } from '../../schemas/User';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reminders')
		.setDescription('Commands related to the reminder system.')
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
				.setName('view')
				.setDescription('View your current reminders.')
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('add')
				.setDescription('Adds a new reminder.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('time')
						.setDescription('Time until the reminder (e.g., 1h, 30m).')
						.setRequired(true)
				)
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName('remove')
				.setDescription('Removes an existing reminder.')
				.addStringOption(
					new SlashCommandStringOption()
						.setName('id')
						.setDescription('The ID of the reminder.')
						.setRequired(true)
				)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const user = await UserModel.findById(interaction.user.id) ??
			await UserModel.create({ _id: interaction.user.id });

		switch (interaction.options.getSubcommand()) {
			case 'view':
				if (user.reminders.length == 0) {
					interaction.reply({
						embeds: [
							new EmbedBuilder()
								.setColor(EmbedColor.danger)
								.setDescription('You have no reminders.')
						],
						ephemeral: true
					});
					return;
				}

				const embed = new EmbedBuilder({ color: EmbedColor.primary, title: 'Reminders' });

				user.reminders.forEach(reminder => {
					embed.addFields(
						{ name: '\u200b', value: '\u200b' },
						{ name: 'ID', value: reminder._id, inline: true },
						{
							name: 'Expiration',
							value: `<t:${reminder.expiration}:R>`,
							inline: true
						}
					);
				});

				interaction.reply({ embeds: [embed.spliceFields(0, 1)] });
				return;

			case 'add':
				const time = interaction.options.getString('time');
				const seconds = parseTimeString(time);

				if (seconds == null) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'Invalid time format. Use `h` for hours, `m` for minutes, and `s` for seconds.'
							})
						],
						ephemeral: true
					});
					return;
				}
				else if (user.reminders.length >= 5) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'You have reached your limit of 5 simultaneous reminders.'
							})
						],
						ephemeral: true
					});
					return;
				}

				const now = Math.floor(Date.now() / 1000);
				const addReminder = { _id: base64(Date.now()), expiration: now + seconds };

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.success,
							title: 'Reminder Created',
							description: `Reminder successfully scheduled for <t:${now + seconds}:R>.`
						})
					],
					ephemeral: true
				});

				user.reminders.push(addReminder);
				user.save();

				setTimeout(async () => {
					if ((await UserModel.findById(interaction.user.id)).reminders
						.findIndex(r => r._id == addReminder._id) == -1) return;

					interaction.user.send({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.primary,
								title: 'Reminder',
								description: `⏰ ${time} has passed!`
							})
						],
						components: [
							new ActionRowBuilder<ButtonBuilder>()
								.addComponents(
									Button.primary({
										custom_id: `reminders|dismiss|${addReminder._id}`,
										label: 'Dismiss'
									}),
									Button.secondary({
										custom_id: `reminders|snooze|${addReminder._id}`,
										label: 'Snooze'
									})
								)
						]
					});
				}, seconds * 1000);
				return;

			case 'remove':
				const id = interaction.options.getString('id');
				const removeReminder = user.reminders.find(reminder => reminder._id == id);

				if (!removeReminder) {
					interaction.reply({
						embeds: [
							new EmbedBuilder({
								color: EmbedColor.danger,
								description: 'You do not have a reminder with that ID.'
							})
						],
						ephemeral: true
					});
					return;
				}

				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.success,
							title: 'Reminder Removed',
							fields: [
								{ name: 'ID', value: removeReminder._id },
								{ name: 'Expiration', value: `<t:${removeReminder.expiration}:R>` }
							]
						})
					],
					ephemeral: true
				});

				user.reminders.splice(user.reminders.indexOf(removeReminder), 1);
				user.save();
		}
	},

	async onButtonInteraction(interaction: ButtonInteraction) {
		const user = await UserModel.findById(interaction.user.id);
		const [, action, id] = interaction.customId.split('|');
		const reminder = user.reminders.find(reminder => reminder._id == id);

		interaction.message.edit({
			components: [
				new ActionRowBuilder<ButtonBuilder>()
					.addComponents(
						Button.primary({
							custom_id: `reminders|dismiss|${reminder._id}`,
							label: 'Dismiss',
							disabled: true
						}),
						Button.secondary({
							custom_id: `reminders|snooze|${reminder._id}`,
							label: 'Snooze',
							disabled: true
						})
					)
			]
		});

		if (!reminder) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'Reminder not found.'
					})
				],
				ephemeral: true
			});
		}
		else if (action == 'dismiss') {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.success,
						description: 'Reminder dismissed.'
					})
				],
				ephemeral: true
			});
			user.reminders.splice(user.reminders.indexOf(reminder), 1);
			user.save();
		}
		else if (action == 'snooze') {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.success,
						description: 'Snoozed for 5m.'
					})
				],
				ephemeral: true
			});

			reminder.expiration = Math.floor((Date.now() + 300000) / 1000);
			user.save();

			setTimeout(async () => {
				if ((await UserModel.findById(interaction.user.id)).reminders
					.findIndex(r => r._id == reminder._id)) return;

				interaction.user.send({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.primary,
							title: 'Reminder',
							description: '⏰ 5m has passed!'
						})
					],
					components: [
						new ActionRowBuilder<ButtonBuilder>()
							.addComponents(
								Button.primary({
									custom_id: `reminders|dismiss|${reminder._id}`,
									label: 'Dismiss'
								}),
								Button.secondary({
									custom_id: `reminders|snooze|${reminder._id}`,
									label: 'Snooze'
								})
							)
					]
				});
			}, 300000);
		}
	}
};

function parseTimeString(timeString: string): number | null {
	const match = timeString.match(/(\d+)([hms])/);
	if (!match) return null;

	const value = parseInt(match[1]);
	const unit = match[2];

	switch (unit) {
		case 'h': return value * 60 * 60;
		case 'm': return value * 60;
		case 's': return value;
		default: return null;
	}
}

function base64(num: number) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+,';
	let encoded = '';

	while (num > 0) {
		encoded = alphabet[num % 64] + encoded;
		num = Math.floor(num / 64);
	}

	return encoded;
}