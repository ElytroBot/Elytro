import { ActionRowBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, SlashCommandBuilder, SlashCommandUserOption, User } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel, getLevel, getXP } from '../../schemas/Guild';
import { EmbedColor } from '../../structure/EmbedColor';
import { UserModel } from '../../schemas/User';
import sharp from 'sharp';
import { Button } from '../../structure/Button';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('level')
		.setDescription('View a user\'s level.')
		.addUserOption(
			new SlashCommandUserOption()
				.setName('user')
				.setDescription('The user whose level you want to see')
		),

	async onCommandInteraction(interaction: ChatInputCommandInteraction) {
		const dbGuild = await GuildModel.findById(interaction.guild.id);
		const user = interaction.options.getUser('user') ?? interaction.user;

		if (!dbGuild.xp.get(user.id)) {
			interaction.reply({
				embeds: [
					new EmbedBuilder({
						color: EmbedColor.danger,
						description: 'This user has no XP.'
					})
				],
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		interaction.guild.members
			.fetch(user.id)
			.then(async member => {
				const dbUser = await UserModel.findById(member.id);
				const xp = dbGuild.xp.get(member.id);
				const level = getLevel(xp);

				let rank = 1;
				dbGuild.xp.forEach(xp => xp > dbGuild.xp.get(user.id) && rank++);

				interaction.reply({
					components: [
						new ActionRowBuilder<Button>()
							.addComponents(Button.link({ emoji: '✏️', label: 'Edit card', url: 'https://elytro-bot.vercel.app/dashboard' }))
					],
					files: [{
						attachment: await LevelCard.from({
							user: user,
							background: dbUser?.background,
							accent: dbUser?.accent,
							xp: xp - getXP(level),
							neededXP: getXP(level + 1) - getXP(level),
							rank: rank,
							level: level
						})
					}]
				});
			})
			.catch(() => {
				interaction.reply({
					embeds: [
						new EmbedBuilder({
							color: EmbedColor.danger,
							description: 'Could not find this user in this server.'
						})
					],
					flags: MessageFlags.Ephemeral
				});
			});
	}
} satisfies Command;

interface CardOptions {
	user: User;
	background?: string;
	accent?: string;
	xp: number;
	neededXP: number;
	rank: number;
	level: number;
}

class LevelCard {
	static async from(options: CardOptions) {
		const background = options.background?
			Buffer.from(await fetch(options.background).then(res => res.arrayBuffer())).toString('base64') :
			null;
		const avatar = Buffer.from(
			await fetch(options.user.avatarURL({ extension: 'png' }) ?? `https://cdn.discordapp.com/embed/avatars/${(BigInt(options.user.id) >> 22n) % 6n}.png`)
				.then(res => res.arrayBuffer())
		).toString('base64');
		const formatter = Intl.NumberFormat('en', { notation: 'compact' });

		const svg = `
			<svg width="550" height="150">
				<defs>
					<clipPath id="avatar">
						<circle cx="75" cy="75" r="50" />
					</clipPath>
					<clipPath id="progress-bar">
						<rect x="135" y="90" width="385" height="20" rx="10" fill="white" />
					</clipPath>
				</defs>
				<rect width="550" height="150" fill="#2b2d30" />
				${options.background? `<image href="data:image/${options.background.split('.').reverse()[0]};base64,${background}" width="550" height="150" preserveAspectRatio="xMidYMid slice" />` : ''}
				<image href="data:image/png;base64,${avatar}" x="25" y="25" width="100" height="100" clip-path="url(#avatar)" />
				<rect x="135" y="90" width="385" height="20" rx="10" fill="white" />
				<rect x="0" y="90" width="${(options.xp / options.neededXP) * 385 + 135}" height="20" rx="10" fill="${options.accent ?? '#04a0fb'}" clip-path="url(#progress-bar)" />
				<text x="135" y="80" font-family="Geist, sans-serif" font-size="25" fill="#ffffff">${options.user.displayName}</text>
				<text x="520" y="80" font-family="Geist, sans-serif" font-size="15" fill="#ffffff" text-anchor="end">
					${formatter.format(options.xp)} / ${formatter.format(options.neededXP)}
				</text>
				<text x="395" y="45" font-family="Geist, sans-serif" font-size="22" fill="#f5d131" text-anchor="end">
					RANK ${options.rank}
				</text>
				<text x="520" y="45" font-family="Geist, sans-serif" font-size="22" fill="${options.accent ?? '#04a0fb'}" text-anchor="end">
					LEVEL ${options.level}
				</text>
			</svg>
		`;

		return sharp(Buffer.from(svg))
			.png()
			.toBuffer();
	}
}