import * as mongoose from 'mongoose';
import {Schema, Connection, Document, Model} from 'mongoose';
const mongooseDeepPopulate = require('mongoose-deep-populate');

export default function(db: Connection): Model<Document> {
	const deepPopulate = mongooseDeepPopulate(mongoose);

	const schema = new Schema({
		createdAt: { type: Date, required: true, default: Date.now },
		user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
		ss: { type: Schema.Types.ObjectId, required: true, ref: 'SS' }
	});

	schema.index({
		user: 1, ss: 1
	}, {
		unique: true
	});

	if (!(<any>schema).options.toObject) {
		(<any>schema).options.toObject = {};
	}
	(<any>schema).options.toObject.transform = (doc: any, ret: any) => {
		ret.id = doc.id;
		delete ret._id;
		delete ret.__v;
	};

	schema.plugin(deepPopulate);

	return db.model('ReadLater', schema, 'readLater');
}
