const test = () => {
	const arr = [1, 2, 3, 4, 5];
	const obj = {
		name: "John",
		age: 20,
		city: "New York",
	};
	const obj1 = Object.keys(obj).map(key => obj[key]);
	const obj2 = Object.values(obj).map(value => value * 2);
	Object.keys(obj).forEach(key => {
		console.log(key);
	});
	for (const [key, value] of Object.entries(obj)) {
		console.log(key, value);
	}
	const arr1 = arr.filter(item => item % 2 === 0);
	const arr2 = arr.map(item => item * 2);
	arr.forEach(item => {
		console.log(item);
	});
	for (const i = 0; i < arr.length; i++) {
		console.log(arr[i]);
		arr[i] = "update " + arr[i];
	}
	//delete first
	arr.splice(1, 1);
	//delete last
	arr.splice(arr.length - 1, 1);
	//prepend
	arr.unshift("add");
	//append
	arr.push("add");
};
switch (key) {
	case value:
		break;

	default:
		break;
}

function columnTraverse(matrix) {
	const rows = matrix.length;
	const cols = matrix[0].length;
	let row = rows - 1;
	let col = cols - 1;
	let direction = "up";
	const output = [];
	let index = 0;

	while (index < rows * cols) {
		output[index++] = matrix[row][col];
		if (row % (rows - 1) === 0 && index !== 1) {
			if (row === 0) {
				if (direction == "up") {
					col--;
				} else {
					row++;
				}
				direction = "down";
			} else if (row === rows - 1) {
				if (direction == "down") {
					col--;
				} else {
					row--;
				}
				direction = "up";
			}
		} else {
			switch (direction) {
				case "up":
					row--;
					break;
				case "down":
					row++;
					break;
			}
		}
	}

	return output;
}

function verticalTraverse(matrix) {
	if (matrix.length === 0 || matrix[0].length === 0) {
		return [];
	}
	const rows = matrix.length;
	const cols = matrix[0].length;
	const result = [];
	let index = 0;
	let row = rows - 1;
	let col = cols - 1;
	while (index < rows * cols) {
		result[index++] = matrix[row][col];
		if (row === 0) {
			row = rows - 1;
			col--;
		} else {
			row--;
		}
	}
	return result;
}

const matrix = [
	[1, 2, 3, 4],
	[5, 6, 7, 8],
	[9, 10, 11, 12],
];

const result = columnTraverse(matrix);
const result2 = verticalTraverse(matrix);
console.log(result.join(" "));
console.log(result2.join(" "));
var element = document.getElementsByClassName("test");
if (element) {
	element[0].addEventListener("click", () => {
		console.log("clicked");
	});
	element[0].innerHTML = "clicked";
	element[0].style.color = "red";
}

function solution1(a) {
	a = parseInt(a).toString();
	var arr = a.split("");
	var sum = 0;
	for (var i = 0; i < arr.length; i++) {
		sum += parseInt(arr[i]);
	}
	return sum;
}
function solution2(a) {
	var indexOfMinimum = -1;
	var minimalSum = Number.MAX_VALUE;

	for (var i = 0; i < a.length; i++) {
		var sum = 0;
		for (var j = 0; j < a.length; j++) {
			sum += Math.abs(a[j] - a[i]);
		}
		if (sum < minimalSum) {
			minimalSum = sum;
			indexOfMinimum = i;
		}
	}

	return a[indexOfMinimum];
}

const pyramid = n => {
	const rows = [];
	for (let i = 1; i <= n; i++) {
		const spaces = " ".repeat(n - i);
		const stars = "*".repeat(2 * i - 1);
		rows.push(spaces + stars);
	}
	console.log(rows.join("\n"));
	return rows;
};

pyramid(5);
test();

function transposeSeating(seating) {
	let rows = seating.length;
	let cols = rows > 0 ? seating[0].length : 0;
	let transposed = [];

	for (let i = 0; i < cols; ++i) {
		transposed[i] = [];
		for (let j = 0; j < rows; ++j) {
			transposed[i][j] = seating[j][i];
		}
	}

	return transposed;
}

let restaurantSeating = [
	[10, 11, 12],
	[20, 21, 22],
];

let transposedSeating = transposeSeating(restaurantSeating);

for (let row of transposedSeating) {
	console.log(row.join(" "));
}

function reverseTransposeMatrix(matrix) {
	let rows = matrix.length;
	let cols = rows > 0 ? matrix[0].length : 0;
	let row = cols - 1;
	let col = rows - 1;
	let result = [];

	for (let i = 0; i < cols; i++) {
		result[cols - i] = [];
		for (let j = 0; j < rows; j++) {
			result[cols - i][j] = matrix[j][i];
		}
	}

	return result;
}

let matrix = [
	[101, 102, 103, 104],
	[201, 202, 203, 204],
	[301, 302, 303, 304],
];

let transposedMatrix = reverseTransposeMatrix(matrix);
for (let row of transposedMatrix) {
	if (row) {
		console.log(row.join(" "));
	}
}

function reflectOverSecondaryDiagonal(matrix) {
	let size = matrix.length;
	let newMatrix = [];

	for (let i = 0; i < size; ++i) {
		newMatrix[i] = [];
		for (let j = 0; j < size; ++j) {
			// TODO: Complete the code to obtain the reflected square matrix in newMatrix.
			newMatrix[i][j] = matrix[size - 1 - j][size - 1 - i];
		}
	}
	return newMatrix;
}

// Example square matrix to reflect over the secondary diagonal
let squareMatrix = [
	[1, 2, 3],
	[4, 5, 6],
	[7, 8, 9],
];

// TODO: Call the function on squareMatrix and store the result in transformedMatrix.
let transformedMatrix = reflectOverSecondaryDiagonal(squareMatrix);
// Print the transformed matrix.
for (let row of transformedMatrix) {
	if (row) {
		console.log(row.join(" "));
	}
}

class Dog {
	constructor(name) {
		this.name = name;
	}
}
class Labrador extends Dog {
	constructor(name, size) {
		super(name);
		this.size = size;
	}
}
const labrador = new Labrador("Buddy", "large");
console.log(labrador.name, labrador.size);

// Generator function
function* conversation() {
	const answer = yield "What is your name?";
	yield `Hello, ${answer}!`;
}
const chat = conversation();
console.log(chat.next().value); // "What is your name?"
console.log(chat.next("Alex").value); // "Hello, Alex!"

const getList = ([x, ...y]) => [x, y];
console.log(getList([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
// output: [1, [2, 3, 4, 5, 6, 7, 8, 9, 10]]

const name = [..."012234"];
console.log(name);
// output: ["0", "1", "2", "2", "3", "4"]

const unique = new Set(name);
console.log([...unique]);
// output: ["0", "1", "2", "3", "4"]
