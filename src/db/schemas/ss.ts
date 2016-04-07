import {Schema, Connection, Document, Model} from 'mongoose';

const base: Object = {
	registeredAt: { type: Date, required: true, default: Date.now },
	createdAt: { type: Date, required: false, default: null },
	title: { type: String, required: true },
	series: [{ type: Schema.Types.ObjectId, required: false, default: null, ref: 'Series', index: true }],
	characters: [{
		_id: false,
		profile: { type: Schema.Types.ObjectId, ref: 'Character', index: true },
		onStageRatio: { type: Number }
	}],
	tags: [{ type: Schema.Types.ObjectId, required: false, default: null, ref: 'SSTag', index: true }],
	favoritesCount: { type: Number, required: false, default: 0 },
	commentsCount: { type: Number, required: false, default: 0 },
	views: [{ type: String, required: false, default: null }],
	ratings: [{
		user: { type: Schema.Types.ObjectId, ref: 'User' },
		rating: { type: Number }
	}],
	pagesCount: { type: Number },
	readingTimeMinutes: { type: Number },
	htmlInfo: { type: String },
	htmlStyle: { type: String },
	isDeleted: { type: Boolean, required: false, default: false }
};

const baseSchema = new Schema(Object.assign({
	type: { type: String, required: true }
}, base));

const threadPostSchema = new Schema({
	createdAt: { type: Date, required: true },
	createdAtStr: { type: String, required: false },
	number: { type: Number, required: true },
	text: { type: String, required: true },
	html: { type: String, required: false, default: null },
	user: {
		name: { type: String, required: true },
		id: { type: String, required: true },
		bg: { type: String, required: false },
		fg: { type: String, required: false },
	},
	isAA: { type: Boolean, required: false, default: false },
	isMaster: { type: Boolean, required: false, default: true },
	isAnchor: { type: Boolean, required: false, default: false }
}, {
	// Disable indexing for each posts
	_id: false
});

const threadSchema = new Schema(Object.assign({
	url: { type: String, required: true, unique: true },
	type: { type: String, required: false, default: 'thread' },
	posts: [ threadPostSchema ]
}, base));

if (!(<any>baseSchema).options.toObject) {
	(<any>baseSchema).options.toObject = {};
}
(<any>baseSchema).options.toObject.transform = (doc: any, ret: any) => {
	ret.id = doc.id;
	delete ret._id;
	delete ret.__v;
};

if (!(<any>threadPostSchema).options.toObject) {
	(<any>threadPostSchema).options.toObject = {};
}
(<any>threadPostSchema).options.toObject.transform = (doc: any, ret: any) => {
	ret.id = doc.id;
	delete ret._id;
	delete ret.__v;
};

if (!(<any>threadSchema).options.toObject) {
	(<any>threadSchema).options.toObject = {};
}
(<any>threadSchema).options.toObject.transform = (doc: any, ret: any) => {
	ret.id = doc.id;
	delete ret._id;
	delete ret.__v;
};

export default function (db: Connection): Model<Document>[] {
	const Base = db.model('SS', baseSchema, 'ss');
	const Thread = db.model('SSThread', threadSchema, 'ss');

	const init = Base.prototype.init;
	init.thread = (<any>new Thread()).__proto__;
	Base.prototype.init = function (doc: any, fn: any): any {
		const obj = init.apply(this, arguments);
		obj.__proto__ = init[doc.type];
		return obj;
	};

	return [
		Base,
		Thread
	];
}
