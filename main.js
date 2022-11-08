"use strict";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
import inquirer from "inquirer";
import all from "it-all";
import fs from "fs";
import path from "path";
import { Blob } from "buffer";
import { exit } from "process";
import { setMaxListeners } from "events";
import navigateOption from "./mfs.js";
// import peerNavigate from "./peer.js";
var clc = require("cli-color");
import * as IPFSNode from "ipfs-core";
import { create } from "ipfs-http-client";
import { URL } from "url";
import { spawnSync } from "child_process";
var spawn = require("child_process").spawn;
const execSync = require("child_process").execSync;
// import getFolderSize from "get-folder-size";

setMaxListeners(1024);
export var colorSpec = {
  errorMsg: (x) => {
    return colorSpec.errorIcon + "  " + clc.red.bold(x) + "\n\n";
  },
  warnMsg: (x) => {
    return colorSpec.warnIcon + "  " + clc.yellow(x) + "\n\n";
  },
  infoMsg: (x) => {
    return colorSpec.infoIcon + "  " + clc.cyan(x) + "\n\n";
  },
  errorIcon: clc.red.bold("✖"),
  successIcon: clc.green.bold("✔"),
  warnIcon: clc.yellow("⚠"),
  infoIcon: clc.cyan("ℹ"),
  promptIcon: clc.blue("➜"),
  fileColor: clc.magenta,
  dirColor: clc.green,
};

export default { colorSpec: colorSpec };
const ui = new inquirer.ui.BottomBar();
// ui.log.write(
//   colorSpec.infoMsg(
//     "ipfs-core package inits ipfs node in the application and has memory issues that cause the application run slowly. \nInstead, we recommend to init the ipfs node in a background process. Don't worry, we will the handle the daemon."
//   )
// );
// const daemonQuestion = {
//   type: "input",
//   name: "deamon",
//   message:
//   "Would you want to start a deamon [y] or just use ipfs-core package[n] ?: ",
// };
var ipfs = await IPFSNode.create({
  libp2p: {
    connectionManager: {
      autoDial: false,
    },
  },
});
// var httpApiEndpoint = undefined;
// var ipfsProc = undefined;
// function waitForDaemon(ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }

// await inquirer.prompt(daemonQuestion).then(async (answers) => {
//   if (answers.deamon === "y") {
//     ui.log.write("Starting ipfs in a background deamon process...");
//     let maxWait = 16000;
//     let curWait = 0;
//     ipfsProc = spawn("jsipfs", ["daemon"], { detached: true });

//     ipfsProc.stdout.setEncoding("utf8");
//     ipfsProc.stdout.on("data", async (data) => {
//       // ui.log.write(`stdout: ${data}`);
//       var re = new RegExp(String.raw`HTTP.*\s(\/.*http)`);
//       const matched = data.match(re);
//       if (matched) {
//         httpApiEndpoint = matched[1];
//       }
//       if (data.trim().includes("Daemon is ready")) {
//         ui.log.write(colorSpec.infoMsg("Daemon is ready"));
//         ipfs = create(httpApiEndpoint);
//         ipfsProc.unref();
//       }
//       // ipfs = await create(new URL("/ip4/127.0.0.1/tcp/5002/http"));
//     });
//     ipfsProc.stderr.on("data", (data) => {
//       ui.log.write(colorSpec.errorMsg(data));
//       exitProgram("exit");
//     });
//     ipfsProc.on("close", (code) => {
//       ui.log.write(colorSpec.errorMsg(data));
//       exitProgram("exit");
//     });
//     while (ipfs === undefined) {
//       const waitMs = 2000;
//       await waitForDaemon(waitMs);
//       curWait += waitMs;
//       if (curWait > maxWait) {
//         ui.log.write(colorSpec.errorMsg("Could not start ipfs daemon"));
//         exit(1);
//       }
//     }
//   } else {
//     ui.log.write(colorSpec.infoMsg("Starting ipfs in the application..."));
//     ipfs = await IPFSNode.create({
//       libp2p: {
//         connectionManager: {
//           autoDial: false,
//         },
//       },
//     });
//   }
// });

// console.log(ipfs.libp2p.connectionManager.autoDial)
// ipfs.libp2p.connectionManager.autoDial = false;
// ipfs.libp2p.connectionManager.addEventListener("peer:connect", (peer) => {console.log('hiiiii')});
var exitEntered = false;
[
  `exit`,
  `SIGINT`,
  `SIGUSR1`,
  `SIGUSR2`,
  `uncaughtException`,
  `SIGTERM`,
].forEach((eventType) => {
  process.on(eventType, exitProgram.bind(null, eventType));
});

function exitProgram(eventType) {
  console.log(colorSpec.infoMsg(`[${eventType}] Exiting program...`));

  process.exit(0);
}

const { readdir, stat } = require("fs/promises");
const { join } = require("path");

const dirSize = async (dir) => {
  const files = await readdir(dir, { withFileTypes: true });

  const paths = files.map(async (file) => {
    const path = join(dir, file.name);

    if (file.isDirectory()) return await dirSize(path);

    if (file.isFile()) {
      const { size } = await stat(path);

      return size;
    }

    return 0;
  });

  return (await Promise.all(paths))
    .flat(Infinity)
    .reduce((i, size) => i + size, 0);
};

var totalStdoutColumns = process.stdout.columns || 100;
process.stdout.on("resize", function () {
  totalStdoutColumns = process.stdout.columns;
});

var totalUploadedBytes = 0;
var totalDirSize = 0;
var curFileTotalSize = 0;
var lastFile = undefined;
var lastValue = 0;
async function byteProcess(x, y) {
  console.log("file", y);
  lastValue = x;
  if (lastFile === undefined) {
    lastFile = y;
    curFileTotalSize = x;
  } else {
    if (lastFile === y) {
      curFileTotalSize = x;
      console.log("curfile updated: ", curFileTotalSize);
    } else {
      console.log("hi");
      console.log("curfile total ", curFileTotalSize);
      totalUploadedBytes += curFileTotalSize;
      curFileTotalSize = x;
      lastFile = y;
    }
  }
  console.log("-------------");
  console.log("uploaded updated: ", totalUploadedBytes);

  // totalUploadedBytes += x;
  // let percent = Math.floor(
  //   (totalUploadedBytes / totalDirSize) * totalStdoutColumns
  // );
  // console.log(percent)
  // let bar = "█".repeat(percent);
  // let bottomBar = colorSpec.infoMsg(`Uploading: ${percent.toString()}% ${bar}`);
  // ui.updateBottomBar(bottomBar);
}

// Clear the screen
// process.stdout.write("\u001b[2J\u001b[0;0H");
const saveToIpfs = async (providedPath) => {
  const fileStats = fs.lstatSync(providedPath);
  //example options to pass to IPFS
  const addOptions = {
    pin: false,
    wrapWithDirectory: true,
    timeout: 1000 * 60 * 5,
    // progress: async (progress, filePath) => {
    //  await byteProcess(progress, filePath);
    // },
  };

  if (fileStats.isDirectory()) {
    // const size = await dirSize(providedPath);
    // console.log('total dir size', size)
    // totalDirSize = size;
    const globSourceOptions = {
      recursive: true,
      hidden: true,
    };
    for await (const file of IPFSNode.globSource(
      providedPath,
      "**/*",
      globSourceOptions
    )) {
      const addedFile = await ipfs.add(file, addOptions);
      if (addedFile.path.trim() === "") {
        ui.log.write(
          `\nRoot directory ${providedPath} added to IPFS with CID: ${addedFile.cid}`
        );
      } else {
        // await waitForDaemon(200);
        ui.log.write(
          `${providedPath}/${addedFile.path} added with CID ${addedFile.cid}`
        );
      }
    }
  } else {
    const fileObj = {
      path: providedPath,
      content: fs.createReadStream(providedPath),
      mtime: fileStats.mtime,
    };
    const addedFile = await ipfs.add(fileObj, addOptions);
    ui.log.write(`File ${providedPath} added with CID ${addedFile.cid}`);
  }
  // console.log("total uploaded bytes", totalUploadedBytes);
  // totalUploadedBytes = 0;
  // totalDirSize = 0;
};

const getFile = async (cid) => {
  var allBuffers = [];
  for await (const buf of ipfs.get(cid)) {
    allBuffers.push(buf);
  }
  return new Buffer.concat(allBuffers);
};

const catFile = async (ipfsPath) => {
  let allBuffers = [];
  for await (const chunk of ipfs.cat(ipfsPath)) {
    allBuffers.push(chunk);
  }
  return Buffer.concat(allBuffers).toString("utf8");
};

const listFiles = async (ipfsPath) => {
  const files = await all(ipfs.ls(ipfsPath));
  return files;
};

const getCidType = async (files) => {
  let cidType = undefined;
  if (files.length === 1) {
    if (files[0].name === files[0].path) cidType = "file";
    else {
      cidType = "dir";
    }
  } else if (files.length === 0) {
    cidType = "empty";
  } else {
    cidType = "dir";
  }
  return cidType;
};

async function listActionOption(cidType, providedCid) {
  let fileAction = [];
  if (cidType === "dir") {
    fileAction = fileAction.concat([
      { value: "enter", name: "Enter directory" },
      { value: "save", name: "Save directory to local" },
      { value: "back", name: "Go back" },
      { value: "exit", name: "Go to main options" },
    ]);
  } else if (cidType === "file") {
    fileAction = fileAction.concat([
      { value: "save", name: "Save file to local path" },
      { value: "show", name: "Show file contents" },
      { value: "back", name: "Go back" },
      { value: "exit", name: "Go to main options" },
    ]);
  } else if (cidType === "empty") {
    fileAction = fileAction.concat([
      { value: "back", name: "Go back" },
      { value: "exit", name: "Go to main options" },
    ]);
  }
  var returnStatus = undefined;
  await inquirer
    .prompt({
      type: "list",
      name: "fileAction",
      message: "What to do?",
      choices: fileAction,
    })
    .then(async (answers) => {
      if (answers.fileAction === "save") {
        await inquirer
          .prompt({
            type: "input",
            name: "savePath",
            message: "Enter the path to save the file: ",
          })
          .then(async (answers) => {
            await getFile(providedCid).then((x) => {
              fs.writeFileSync(answers.savePath, x);
            });
          });
      } else if (answers.fileAction === "show") {
        const fileContent = await catFile(providedCid);
        ui.log.write(fileContent);
      }
      returnStatus = answers.fileAction;
    });
  return returnStatus;
}

const listOption = async () => {
  await inquirer
    .prompt({
      type: "input",
      name: "ipfsPath",
      message: "Enter the CID to list: ",
      validate(value) {
        if (value === undefined || value === null || value.trim() === "") {
          return "Please enter a valid CID";
        } else {
          return true;
        }
      },
    })
    .then(async (answers) => {
      var providedCid = answers.ipfsPath;
      var lastPath = providedCid;
      while (providedCid) {
        const files = await listFiles(providedCid);
        const cidType = await getCidType(files);
        const status = await listActionOption(cidType, providedCid);

        if (status === "enter") {
          let pathChoices = [];
          files.forEach((file) => {
            pathChoices.push({
              name: `${file.type} - ${file.name} (${file.cid})`,
              value: file.cid.toString(),
            });
          });
          await inquirer
            .prompt({
              type: "list",
              name: "provided",
              message: "Directory contents: ",
              choices: pathChoices,
            })
            .then(async (answers) => {
              lastPath = providedCid;
              providedCid = answers.provided;
            });
        } else if (status === "back") {
          if (lastPath === providedCid) {
            return;
          }
          providedCid = lastPath;
        } else if (status === "exit") {
          return;
        }
      }
    });
};

const getOption = async () => {
  await inquirer
    .prompt({
      type: "input",
      name: "ipfsPath",
      message: "Enter the CID of file/directory: ",
      validate(value) {
        if (value === undefined || value === null || value.trim() === "") {
          return "Please enter a valid CID";
        } else {
          return true;
        }
      },
    })
    .then(async (answers) => {
      const providedCid = answers.ipfsPath;
      const files = await listFiles(providedCid);
      const cidType = await getCidType(files);

      ui.log.write("Contents: ");
      files.forEach((file) => {
        ui.log.write(`${file.type} - ${file.name} (${file.cid})`);
      });

      let fileAction = [];
      if (cidType === "dir") {
        fileAction = fileAction.concat([
          { value: "save", name: "Save directory to local" },
          { value: "exit", name: "Go to main options" },
        ]);
      } else if (cidType === "file") {
        fileAction = fileAction.concat([
          { value: "save", name: "Save file to local path" },
          { value: "show", name: "Show file contents" },
          { value: "exit", name: "Go to main options" },
        ]);
      } else if (cidType === "empty") {
        fileAction = fileAction.concat([
          { value: "exit", name: "Go to main options" },
        ]);
      }
      await inquirer
        .prompt({
          type: "list",
          name: "fileAction",
          message: "What to do?",
          choices: fileAction,
        })
        .then(async (answers) => {
          if (answers.fileAction === "save") {
            await inquirer
              .prompt({
                type: "input",
                name: "savePath",
                message: "Enter the path to save the file: ",
              })
              .then(async (answers) => {
                await getFile(providedCid).then((x) => {
                  fs.writeFileSync(answers.savePath, x);
                });
              });
          } else if (answers.fileAction === "show") {
            const fileContent = await catFile(providedCid);
            ui.log.write(fileContent);
          }
        });
    });
};

const mainPrompt = async () => {
  while (true) {
    await inquirer
      .prompt({
        type: "list",
        name: "job",
        message: "What do you want to do?",
        choices: [
          {
            value: "peer",
            name: "Peer Network",
          },
          { value: "save", name: "Save file/dir to IPFS" },
          { value: "get", name: "Get file/dir from IPFS" },
          { value: "list", name: "List in IPFS" },
          {
            value: "navigate",
            name: "Navigate in IPFS Mutable File System (MFS)",
          },
        ],
      })
      .then(async (answers) => {
        if (answers.job === "peer") {
          await peerNavigate(ui, ipfs);
        } else if (answers.job === "save") {
          await inquirer
            .prompt({
              type: "input",
              name: "path",
              message: "Enter the path of the file to save: ",
              validate(value) {
                if (fs.existsSync(value)) {
                  return true;
                } else {
                  return "Please enter a valid path";
                }
              },
            })
            .then(async (answers) => {
              await saveToIpfs(answers.path);
            });
        } else if (answers.job === "get") {
          await getOption();
        } else if (answers.job === "list") {
          await listOption();
        } else if (answers.job === "navigate") {
          await navigateOption(ui, ipfs);
        }
        // Use user feedback for... whatever!!
      })
      .catch((error) => {
        if (error.isTtyError) {
          console.log("Prompt couldn't be rendered in the current environment");
        } else {
          console.log("Something else went wrong");
          console.log(error);
        }
        exit(1);
      });
  }
};

mainPrompt();