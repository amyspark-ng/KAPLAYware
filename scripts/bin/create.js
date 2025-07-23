import prompts from "prompts";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

export async function runWizard() {
	const response = await prompts([
		{
			type: "text",
			name: "authorName",
			message: "Author name:",
			initial: "amyspark",
		},
		{
			type: "text",
			name: "packName",
			message: "Pack name:",
			initial: "my-super-pack-1",
		},
	]);

	const targetDir = path.resolve(process.cwd(), response.projectName);
	await fs.mkdirp(targetDir);
}

runWizard();
