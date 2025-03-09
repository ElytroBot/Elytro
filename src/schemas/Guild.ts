import { model, Schema } from 'mongoose';

const WarnSchema = new Schema({
	_id: {
		type: String,
		required: true,
		default: () => Date.now()
			.toString(36)
			.toUpperCase()
	},
	user_id: {
		type: String,
		required: true
	},
	reason: String
});

const LevelingRewardSchema = new Schema({
	level: {
		type: Number,
		required: true
	},
	role: {
		type: String,
		required: true
	}
}, { _id: false });

const TicketingPanel = new Schema({
	channel: {
		type: String,
		required: true
	},
	message: {
		type: String,
		required: true
	},
	transcripts_channel: {
		type: String,
		required: true
	}
}, { _id: false });

const GuildSchema = new Schema({
	_id: {
		type: String,
		required: true
	},
	plugins: [String],
	warns: [WarnSchema],
	xp: {
		type: Map,
		of: Number,
		default: new Map()
	},
	leveling_message: {
		channel: String,
		content: String
	},
	leveling_rewards: [LevelingRewardSchema],
	join_message: {
		channel: String,
		content: String
	},
	leave_message: {
		channel: String,
		content: String
	},
	ticketing_panels: [TicketingPanel],
	ticket_channel: String,
	ticket_logs_channel: String
}, { versionKey: false });

export const GuildModel = model('Guild', GuildSchema);

export function getLevel(xp: number) {
	for (let i = 0;; i++) {
		if (xp < getXP(i + 1)) return i;
	}
}

export function getXP(level: number) {
	if (level == 0) return 0;
	return level * 100 + getXP(level - 1);
}