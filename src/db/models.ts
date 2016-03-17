//////////////////////////////////////////////////
// DB MODELS LOADER
//////////////////////////////////////////////////

import db from './db';

//////////////////////////////////////////////////
// INIT SCHEMAS

import character from './schemas/character';
import favorite from './schemas/favorite';
import history from './schemas/history';
import readLater from './schemas/read-later';
import series from './schemas/series';
import ss from './schemas/ss';
import user from './schemas/user';
import visitHistory from './schemas/visit-history';

/* tslint:disable:variable-name */
export const Character = character(db);
export const Favorite = favorite(db);
export const History = history(db);
export const ReadLater = readLater(db);
export const Series = series(db);
export const SS = ss(db)[0];
export const SSThread = ss(db)[1];
export const User = user(db);
export const VisitHistory = visitHistory(db);
