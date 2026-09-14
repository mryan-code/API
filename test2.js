// Create a get() function that takes as input:
// get(dblist, pivot_id, page_size, page_number): Array
// dblist: Array of unique integers.
// pivot_id: Integer in the array. (value is present in dblist)
// page_size: Number of items per page. (value > 0)
// page_number: Index of the page we want to return. (value ≥ 0)
// Space constraint: Your function should use O(page_size) extra space, not O(n) extra space, where n is len(dblist). This means you're not allowed to build a second full-length array as a working structure.
// dblist = [2, 23, 5, 42, 7, 9, 19]
// get(dblist, pivot_id=5, page_size=2, page_num=0) # [5, 42]
// get(dblist, pivot_id=5, page_size=4, page_num=0) # [5, 42, 7, 9]

// get(dblist, pivot_id=5, page_size=2, page_num=1) # [7, 9]
// get(dblist, pivot_id=5, page_size=2, page_num=2) # [19, 2]
// get(dblist, pivot_id=5, page_size=3, page_num=2) # [19, 2, 23]
// get(dblist, pivot_id=5, page_size=2, page_num=3) # [23]
// get(dblist, pivot_id=5, page_size=2, page_num=6) # []
// get(dblist, pivot_id=5, page_size=2, page_num=1000) # []

function get(dblist, pivot_id, page_size = 2, page_number = 0) {
	const newArray = [];
	try {
		const totalItems = page_number
			? page_number * page_size
			: (page_number + 1) * page_size;
		console.log("totalItems", totalItems);
		console.log("dblist.length", dblist.length);
		if (dblist.length <= totalItems) {
			throw new Error("Double list is less than page size * page number");
		}
		let pivotMin = dblist.indexOf(pivot_id) + page_number * page_size;
		let pivotMax =
			dblist.indexOf(pivot_id) +
			(page_size - 1) +
			page_number * page_size;
		for (let i = 0; i <= dblist.length; i++) {
			if (
				i >= pivotMin &&
				i <= pivotMax &&
				!newArray.includes(dblist[i])
			) {
				newArray.push(dblist[i]);
			}
			if (newArray.length === page_size) {
				break;
			}
			console.log(
				"index",
				i,
				"length",
				dblist.length,
				"pivotMin",
				pivotMin,
				"pivotMax",
				pivotMax,
				"newArray",
				newArray,
				"page_size",
				page_size,
				"page_number",
				page_number,
			);
			if (i + 1 === dblist.length) {
				i = 0;
				pivotMin = 0;
				pivotMax = page_size - 1;
			}
		}
		return newArray;
	} catch (error) {
		console.log(error);
		return newArray;
	}
}

const dblist = [2, 23, 5, 42, 7, 9, 19];
const whatever1 = get(dblist, 5);
const whatever2 = get(dblist, 5, 4);
const whatever3 = get(dblist, 5, 2, 1);
const whatever4 = get(dblist, 5, 2, 2);
const whatever5 = get(dblist, 5, 2, 3);
const whatever6 = get(dblist, 5, 2, 4);
const whatever7 = get(dblist, 5, 2, 6);
const whatever8 = get(dblist, 5, 2, 1000);

console.log(whatever1);
console.log(whatever2);
console.log(whatever3);
console.log(whatever4);
console.log(whatever5);
console.log(whatever6);
console.log(whatever7);
console.log(whatever8);
