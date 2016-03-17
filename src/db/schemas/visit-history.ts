import {Schema, Connection, Document, Model} from 'mongoose';

export default function(db: Connection): Model<Document> {
	const schema = new Schema({
		url: { type: String, required: true, unique: true }
	});

	return db.model('VisitHistory', schema, 'visitHistories');
}
