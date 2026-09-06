import * as types from "../types";
// async function pageFunction(results: types.KeyValue[], parameters: types.KeyValue): Promise<types.KeyValue> {
// 	const page: types.KeyValue = {};
// 	let perPage: number = 0;
// 	if ("per_page" in parameters) {
// 		if (parameters.per_page) {
// 			perPage = parseInt(parameters.per_page);
// 		}
// 	}
// 	let pageNumber: number = 1;
// 	if ("current_page" in parameters) {
// 		if (parameters.current_page) {
// 			pageNumber = parseInt(parameters.current_page);
// 		}
// 	}
// 	let totalResults: number = results.length;
// 	let totalPages: number = 1;
// 	if (perPage > 0 && totalResults > 0) {
// 		totalPages = Math.ceil(totalResults / perPage);
// 		results = results.slice((pageNumber - 1) * perPage, pageNumber * perPage);
// 	}
// 	page["total_pages"] = totalPages;
// 	page["total_results"] = totalResults;
// 	page["current_page"] = pageNumber;
// 	page["per_page"] = perPage;

// 	return { results: results, page: page } as types.KeyValue;
// }
async function pageFunction(model: types.KeyValue, sequelizeOptions: types.KeyValue, parameters: types.KeyValue): Promise<types.KeyValue> {
	const returnObject: types.KeyValue = {};
	const countResult: number = (await model.count(sequelizeOptions)) as unknown as number;
	const page: types.KeyValue = {};
	let perPage: number = 100;
	if ("per_page" in parameters) {
		if (parameters.per_page) {
			perPage = parseInt(parameters.per_page);
		}
	}
	let pageNumber: number = 1;
	if ("current_page" in parameters) {
		if (parameters.current_page) {
			pageNumber = parseInt(parameters.current_page);
		}
	}
	let totalResults: number = countResult;
	let totalPages: number = 1;
	if (perPage > 0 && totalResults > 0) {
		totalPages = Math.ceil(totalResults / perPage);
	}
	page["total_pages"] = totalPages;
	page["total_results"] = totalResults;
	page["current_page"] = pageNumber;
	page["per_page"] = perPage;
	Object.assign(sequelizeOptions, {
		limit: perPage,
		offset: (pageNumber - 1) * perPage,
	});
	returnObject["sequelizeOptions"] = sequelizeOptions;
	returnObject["page"] = page;
	return returnObject;
}

export { pageFunction };
