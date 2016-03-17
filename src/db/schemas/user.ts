import {Schema, Connection, Document, Model} from 'mongoose';

export default function(db: Connection): Model<Document> {

	const schema = new Schema({
		createdAt: { type: Date, required: true, default: Date.now },
		description: { type: String, required: false, default: null },
		email: { type: String, required: false, sparse: true, default: null },
		encryptedPassword: { type: String, required: true },
		isDeleted: { type: Boolean, required: false, default: false },
		isAdmin: { type: Boolean, required: false, default: false },
		isSuspended: { type: Boolean, required: false, default: false },
		name: { type: String, required: false, default: null },
		screenName: { type: String, required: true, unique: true },
		screenNameLower: { type: String, required: true, unique: true, lowercase: true }
	});

	if (!(<any>schema).options.toObject) {
		(<any>schema).options.toObject = {};
	}
	(<any>schema).options.toObject.transform = (doc: any, ret: any) => {
		ret.id = doc.id;
		delete ret._id;
		delete ret.__v;
	};

	return db.model('User', schema, 'users');
}
