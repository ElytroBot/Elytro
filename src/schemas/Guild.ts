import { model, Schema } from 'mongoose';

const WarnSchema = new Schema({
	user_id: {
		type: String,
		required: true
	},
	reason: String
}, { _id: false });

const GuildSchema = new Schema({
	_id: {
		type: String,
		required: true
	},
	warns: [WarnSchema],
	xp: {
		type: Map,
		of: Number,
		default: new Map()
	},
	plugins: [String],
	leveling_channel: String,
	leveling_message: String,
	join_message: {
		channel: String,
		content: String
	},
	leave_message: {
		channel: String,
		content: String
	},
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