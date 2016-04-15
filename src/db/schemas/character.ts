import {Schema, Connection, Document, Model} from 'mongoose';

export default function(db: Connection): Model<Document> {
	const schema: any = new Schema({
		createdAt: { type: Date, required: true, default: Date.now },
		bio: { type: String, required: false, default: null },
		gender: { type: String, required: false, default: null },
		image: { type: Buffer, required: false, default: null },
		color: { type: String, required: false, default: '#000000' },
		kana: { type: String, required: true },
		name: { type: String, required: true },
		ruby: { type: String, required: false, default: null },
		screenName: { type: String, required: true },
		aliases: [{ type: String, required: false, default: null }],
		series: [{ type: Schema.Types.ObjectId, required: true, ref: 'Series' }],
		ssCount: { type: Number, required: false, default: 0 }
	});

	if (!schema.options.toObject) {
		schema.options.toObject = {};
	}
	schema.options.toObject.transform = (doc: any, ret: any) => {
		ret.id = doc.id;
		delete ret._id;
		delete ret.__v;
	};

	return db.model('Character', schema, 'characters');
}
