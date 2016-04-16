import {Schema, Connection, Document, Model} from 'mongoose';

export default function(db: Connection): Model<Document> {
	const schema: any = new Schema({
		createdAt: { type: Date, required: true, default: Date.now },
		image: { type: Buffer, required: false, default: null },
		description: { type: String, required: false, default: null },
		title: { type: String, required: true, unique: true },
		kana: { type: String, required: true },
		aliases: [{ type: String, required: false, default: null }],
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

	return db.model('Series', schema, 'series');
}
