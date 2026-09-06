module.exports = {
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint"],
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
	module: "es2022",
	env: {
		node: true,
		es6: true,
	},
	root: true,
};
