#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Replace copyfiles (and its deprecated glob@7 / inflight tree) with a first-party walker.
const COPY_EXTENSIONS = new Set([".html", ".css", ".js"]);

function shouldCopyFile( filePath ) {
	return COPY_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function collectCopyableFiles( srcRoot ) {
	const files = [];

	function walk( dir ) {
		const entries = fs.readdirSync(dir, { withFileTypes: true });
		for ( const entry of entries ) {
			const fullPath = path.join(dir, entry.name);
			if ( entry.isDirectory() ) {
				walk(fullPath);
				continue;
			}
			if ( entry.isFile() && shouldCopyFile(fullPath) ) {
				files.push(fullPath);
			}
		}
	}

	walk(srcRoot);
	return files;
}

function toDestPath( srcFile, srcRoot, destRoot ) {
	return path.join(destRoot, path.relative(srcRoot, srcFile));
}

function copyProjectFiles( srcRoot, destRoot ) {
	const files = collectCopyableFiles(srcRoot);
	for ( const srcFile of files ) {
		const destFile = toDestPath(srcFile, srcRoot, destRoot);
		fs.mkdirSync(path.dirname(destFile), { recursive: true });
		fs.copyFileSync(srcFile, destFile);
	}
	return files;
}

function main() {
	const appRoot = path.resolve(__dirname, "..");
	const srcRoot = path.join(appRoot, "src");
	const destRoot = path.join(appRoot, "dist");
	const copied = copyProjectFiles(srcRoot, destRoot);
	console.log(`Copied ${copied.length} asset file(s) from src to dist.`);
}

if ( require.main === module ) {
	main();
}

module.exports = {
	shouldCopyFile,
	collectCopyableFiles,
	toDestPath,
	copyProjectFiles,
};
