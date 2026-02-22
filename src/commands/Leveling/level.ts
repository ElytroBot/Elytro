import { ActionRowBuilder, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandUserOption, User } from 'discord.js';
import { Command } from '../../structure/Command';
import { GuildModel, getLevel, getXP } from '../../schemas/Guild';
import { Color } from '../../structure/Color';
import { UserModel } from '../../schemas/User';
import sharp from 'sharp';
import { Button } from '../../structure/Button';
import { Messages } from '../../structure/Messages';

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
		const user = interaction.options.getUser('user') ?? interaction.user;
		const dbGuild = await GuildModel.findById(interaction.guild.id);
		const xp = dbGuild.xp.get(user.id);

		if (!xp) {
			await interaction.reply(Messages.ephemeral(Color.Danger, 'This user has no XP.'));
			return;
		}

		const member = await interaction.guild.members.fetch(user.id).catch(() => {});

		if (!member) {
			await interaction.reply(Messages.MemberNotFound);
			return;
		}

		const dbUser = await UserModel.findById(user.id);
		const level = getLevel(xp);
		const rank = Array.from(dbGuild.xp.values()).reduce((a, v) => v > xp ? a + 1 : a, 1);

		await interaction.reply({
			components: [
				new ActionRowBuilder<Button>()
					.addComponents(Button.link({
						emoji: '✏️',
						label: 'Edit card',
						url: 'https://elytro-bot.vercel.app/dashboard'
					}))
			],
			files: [{
				attachment: await generateCard({
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

async function generateCard(options: CardOptions) {
	const background = options.background
		? Buffer.from(await fetch(options.background).then(res => res.arrayBuffer())).toString('base64')
		: null;
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
			${options.background ? `<image href="data:image/${options.background.split('.').reverse()[0]};base64,${background}" width="550" height="150" preserveAspectRatio="xMidYMid slice" />` : ''}
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

	return sharp(Buffer.from(svg)).png().toBuffer();
}