import { model, Schema } from 'mongoose';

const ReminderSchema = new Schema({
	_id: {
		type: String,
		default: () => Date.now()
			.toString(36)
			.toUpperCase(),
		required: true
	},
	schedule: {
		type: String,
		required: true
	},
	title: {
		type: String,
		required: true
	},
	topic: {
		type: String,
		required: true
	},
	visibility: {
		type: String,
		required: true
	},
	subscribers: {
		type: [String],
		default: [],
		required: true
	}
}, { versionKey: false });

export const ReminderModel = model('Reminder', ReminderSchema);
export type ReminderDocument = ReturnType<typeof ReminderModel.hydrate>;