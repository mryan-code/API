import * as types from "../types";
import * as functions from "./index";
async function getGeoLocation(ip_address: string): Promise<string | null> {
	return new Promise(async resolve => {
		if (ip_address && process.env.GEO_LOCATION_API_KEY) {
			const url = new URL(
				`https://geolocation-db.com/json/${process.env.GEO_LOCATION_API_KEY}/${ip_address}`,
			);
			const response = await fetch(url.toString());
			const json = await response.json();
			const returnValue: types.KeyValue = {};
			returnValue.latitude = json.latitude || "";
			returnValue.longitude = json.longitude || "";
			returnValue.city = json.city || "";
			returnValue.state = json.state || "";
			returnValue.country = json.country_code || "";
			return resolve(`${JSON.stringify(returnValue)}`);
		}
		resolve(null);
	});
}

export { getGeoLocation };
