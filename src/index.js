#!/usr/bin/env mode
import chalk from "chalk";
import inquirer from "inquirer";
import gradient from "gradient-string";
import chalkAnimation from "chalk-animation";
import figlet from "figlet";
import { createSpinner } from "nanospinner";
import sharp from "sharp";
import path from "path";

const indexToFaceName = ["Left", "Front", "Right", "Back", "Top", "Bottom"];

const layouts = {
    "Top/Up face above front face and bottom/down face below front face": [
        { left: 0, top: 1 },
        { left: 1, top: 1 },
        { left: 2, top: 1 },
        { left: 3, top: 1 },
        { left: 1, top: 0 },
        { left: 1, top: 2 },
    ],
    "Top/up face above right face and bottom/down face below right face": [
        { left: 0, top: 1 },
        { left: 1, top: 1 },
        { left: 2, top: 1 },
        { left: 3, top: 1 },
        { left: 2, top: 0 },
        { left: 2, top: 2 },
    ],
};

/**
 * Sleeps for ms miliseconds (default is 2000).
 * @param {number} ms
 * @returns
 */
const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

/**
 * Show the welcome messages.
 */
async function welcome() {
    figlet("Skybox Beautifier", (err, data) => {
        if (err) {
            console.log(err);
            return;
        }

        console.log(gradient.pastel.multiline(data));
    });

    await sleep();

    const welcomeMessage = chalkAnimation.rainbow(
        "Hello, I'm here to help you convert a skybox texture to multiple faces!"
    );

    welcomeMessage.start();

    await sleep();

    welcomeMessage.stop();
}

/**
 * Generic function to ask a question via Inquirer.
 * @param {string} name - The key name for storing the answer.
 * @param {string} message - The prompt message.
 * @param {string} type - The type of input (e.g., "input", "number", "confirm").
 * @param {Array} [choices] - Optional choices for list-type questions.
 * @returns {Promise<any>} - User's response.
 */
async function askQuestion(name, message, type = "input", choices = null) {
    const promptOptions = { name, type, message };
    if (choices) {
        promptOptions.choices = choices;
    }

    const response = await inquirer.prompt(promptOptions);
    return response[name];
}

/**
 * Logs the parameters to the console with beautiful formatting.
 * @param {object} parameters
 */
function printParameters(parameters) {
    console.log(chalk.bgCyanBright("\nProcessing with the following parameters:\n"));

    Object.entries(parameters).forEach(([key, value]) => {
        console.log(chalk.cyanBright(`• ${chalk.bold(key)}: ${value}`));
    });

    console.log("");
}

/**
 * Returns the appropriate obejct depending of ``layout``.
 * @param {number} faceSize
 * @param {string} layout
 * @returns
 */
function layoutToOptions(faceSize, layout) {
    return layouts[layout].map(({ left, top }) => ({
        width: faceSize,
        height: faceSize,
        left: left * faceSize,
        top: top * faceSize,
    }));
}

/**
 * Skybox editing code that extracts smaller faces from
 * the main image.
 * @param {object} data
 */
async function processTexture(data) {
    const spinner = createSpinner("Processing, do not interrupt...").start();
    const options = layoutToOptions(data.faceSize, data.layout);

    try {
        const start = Date.now();

        await Promise.all(
            options.map(async (option, i) => {
                const fileName = path.join(data.savePath, `${indexToFaceName[i]}.png`);
                await sharp(data.path).extract(option).toFile(fileName);
            })
        );

        const end = Date.now();
        spinner.success({ text: `Success! Saved image faces at ${data.savePath}` });
        console.log(chalk.blueBright(`Process took ${end - start} ms`));
    } catch (err) {
        spinner.error({ text: "Failed to process skybox!" });
        console.log(err);
    }
}

console.clear();

await welcome();

const data = {
    path: await askQuestion("path", "Enter the texture path:"),
    faceSize: await askQuestion("faceSize", "Enter the face size:", "number"),
    savePath: await askQuestion("savePath", "Enter the save directory:"),
    layout: await askQuestion("layout", "Select the texture layout:", "list", Object.keys(layouts)),
};

if (await askQuestion("confirmation", "Are all parameters correct?", "confirm")) {
    printParameters(data);
    await processTexture(data);
} else {
    console.log(chalk.bgRed("Process aborted!"));
    process.exit(1);
}
