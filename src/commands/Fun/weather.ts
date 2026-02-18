import { SlashCommandBuilder, ActionRowBuilder, MessageComponentInteraction, ButtonBuilder, SlashCommandStringOption, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../structure/Command';
import { Color } from '../../structure/Color';
import emojis from '../../json/emojis.json';
import { Button } from '../../structure/Button';
import { Messages } from '../../structure/Messages';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('weather')
		.setDescription('Gets the current weather and forecast for a specified location.')
		.addStringOption(
			new SlashCommandStringOption()
				.setName('location')
				.setDescription('The location to get the weather for.')
				.setRequired(true)
		)
		.addStringOption(
			new SlashCommandStringOption()
				.setName('units')
				.setDescription('The system of measurements to use for the results.')
				.addChoices(
					{ name: 'standard', value: 'standard' },
					{ name: 'metric', value: 'metric' },
					{ name: 'imperial', value: 'imperial' }
				)
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const location = interaction.options.getString('location');
		const units = interaction.options.getString('units', false) ?? 'metric';

		try {
			interaction.reply({
				embeds: [await getEmbed(location, units, 0)],
				components: [getActionRow(location, units, 0)]
			});
		}
		catch {
			interaction.reply(Messages.ephemeral(Color.Danger, 'Could not fetch weather data for this location.'));
		}
	},

	async onButtonInteraction(interaction: MessageComponentInteraction) {
		if (interaction.user.id != interaction.message.interactionMetadata.user.id) {
			interaction.reply(Messages.ComponentUseNotAllowed);
			return;
		}

		const [location, units, index] = interaction.customId.split('|');

		try {
			interaction.update({
				embeds: [await getEmbed(location, units, Number(index))],
				components: [getActionRow(location, units, Number(index))]
			});
		}
		catch {
			interaction.reply(Messages.ephemeral(Color.Danger, 'Could not fetch weather data for this location.'));
		}
	}
} satisfies Command;

async function getEmbed(location: string, units: string, index: number) {
	const forecast = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${process.env.WEATHER_API_KEY}&units=${units}`)
		.then(res => res.json());

	return new EmbedBuilder({
		color: Color.Primary,
		title: `Weather in ${forecast.city.name}`,
		description: `<t:${forecast.list[index].dt}:f>`,
		fields: [
			{
				name: 'Temperature',
				value: forecast.list[index].main.temp + (units == 'metric' ? '°C' : units == 'imperial' ? '°F' : 'K'),
				inline: true
			},
			{
				name: 'Feels Like',
				value: forecast.list[index].main.feels_like + (units == 'metric' ? '°C' : units == 'imperial' ? '°F' : 'K'),
				inline: true
			},
			{
				name: 'Precipitation',
				value: `${Math.round(forecast.list[index].pop * 100)}%`,
				inline: true
			},
			{
				name: 'Humidity',
				value: `${forecast.list[index].main.humidity}%`,
				inline: true
			},
			{
				name: 'Wind Speed',
				value: forecast.list[index].wind.speed + (units != 'imperial' ? 'm/s' : 'mph'),
				inline: true
			},
			{
				name: 'Cloud Cover',
				value: `${forecast.list[index].clouds.all}%`,
				inline: true
			}
		],
		thumbnail: { url: `http://openweathermap.org/img/wn/${forecast.list[index].weather[0].icon}.png` }
	});
}

function getActionRow(location: string, units: string, index: number) {
	return new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			Button.primary({
				custom_id: `${location}|${units}|${index - 1}`,
				emoji: emojis.back,
				disabled: index == 0
			}),
			Button.primary({
				custom_id: `${location}|${units}|${index + 1}`,
				emoji: emojis.forward,
				disabled: index == 39 // Total forecasts is 40, subtract one to account for 0
			})
		);
}