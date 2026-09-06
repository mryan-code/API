import * as types from "../types";
import type { Request, Response } from "express";
import moment from "moment-timezone";
type HelperContext = {
	parameters: types.KeyValue;
	message: string[];
	results: types.KeyValue;
	sqlObject: types.KeyValue;
	queries: any[];
	success: boolean;
	// Request/response are preserved so helper functions can access request-scoped Express context when called from an action.
	req?: Request;
	res?: Response;
	// Optional request-scoped metadata used by helpers and tests
	requestUserQuery?: types.KeyValue;
	logNote?: string;
	logObjectID?: number;
	logObject?: string;
	callbackURL?: string;
	// Pagination (e.g. getLeadCallDisposition, getCommunication)
	page?: types.KeyValue;
	sequelizeOptions?: types.KeyValue;
	paginationResult?: types.KeyValue;
	// Timer for request duration
	startTimer?: moment.Moment;
	endTimer?: moment.Moment;
	duration?: string;
	request?: types.KeyValue;
	// Initialized helper contexts always carry per-helper success flags.
	success_object: types.KeyValue;
	settings?: types.KeyValue;
};

export type { HelperContext };
