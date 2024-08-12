#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");
const chalk = require("chalk");
const { Command } = require("commander");
const ora = require("ora");
const semver = require("semver");

const { dependencies, scripts, config } = require("./config");
const { copyDirectoryWithOverwrite } = require("./tools/utils");

// 支持的语言
const languages = {
  en: require("./lang/en"),
  zh: require("./lang/zh"),
};

const program = new Command();
const REQUIRED_NODE_VERSION = ">=14.0.0";

// 检查 Node.js 版本
if (!semver.satisfies(process.version, REQUIRED_NODE_VERSION)) {
  console.log(chalk.red(`${t("nodeVersionError")} ${process.version}.`));
  process.exit(1);
}

program
  .version("1.0.0")
  .argument("<projectPath>", "Path to the target project / 目标项目的路径")
  .option("-l, --lang <language>", "Language for messages / 消息语言", "en")
  .action(async (projectPath, options) => {
    const lang = options.lang === "zh_CN.UTF-8" ? "zh" : "en";
    const t = (key) => languages[lang][key];

    const targetPath = path.resolve(projectPath);
    const packageJsonPath = path.join(targetPath, "package.json");

    // 检查 package.json 是否存在
    if (!fs.existsSync(packageJsonPath)) {
      console.log(chalk.red(t("packageJsonNotFound")));
      process.exit(1);
    }

    let packageJson;
    try {
      packageJson = require(packageJsonPath);
    } catch (error) {
      console.log(chalk.red(t("errorReadingPackageJson")));
      process.exit(1);
    }

    const spinner = ora();

    // 检查并安装依赖
    for (const [dep, version] of Object.entries(dependencies)) {
      if (
        !packageJson.devDependencies ||
        !packageJson.devDependencies[dep] ||
        !semver.satisfies(packageJson.devDependencies[dep], version)
      ) {
        spinner.start(`${t("installing")} ${dep}@${version}...`);
        try {
          execSync(`npm install ${dep}@${version}`, {
            stdio: "inherit",
            cwd: targetPath,
          });
          spinner.succeed(`${t("installed")} ${dep}@${version}`);
        } catch (error) {
          spinner.fail(`${t("failedToInstall")} ${dep}@${version}`);
          console.error(error);
        }
      }
    }

    // 检查并添加脚本
    let scriptsModified = false;
    for (const script in scripts) {
      if (!packageJson.scripts || !packageJson.scripts[script]) {
        spinner.start(`${t("addingScript")} ${script}...`);
        packageJson.scripts = {
          ...packageJson.scripts,
          [script]: scripts[script],
        };
        scriptsModified = true;
        spinner.succeed(`${t("addedScript")} ${script}`);
      }
    }

    // 检查并添加 config
    let configModified = false;
    if (
      !packageJson.config ||
      JSON.stringify(packageJson.config) !== JSON.stringify(config)
    ) {
      spinner.start(t("addingConfig"));
      packageJson.config = { ...packageJson.config, ...config };
      configModified = true;
      spinner.succeed(t("addedConfig"));
    }

    if (scriptsModified || configModified) {
      try {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      } catch (error) {
        console.log(chalk.red(t("errorWritingPackageJson")));
        console.error(error);
      }
    }

    // 检查并复制目录和文件
    const filesToCopy = copyFiles.reduce((prev, cur) => {
      const { src, dest } = cur;
      cur.push({
        src: path.join(
          __dirname,
          src[0] || "templates",
          src[1] || "commit-config"
        ),
        dest: path.join(targetPath, dest || "commit-config"),
      });

      return cur;
    }, []);

    for (const file of filesToCopy) {
      if (fs.lstatSync(file.src).isDirectory()) {
        await copyDirectoryWithOverwrite(file.src, file.dest, t);
      } else {
        await copyDirectoryWithOverwrite(file.src, file.dest, t);
      }
    }

    console.log(chalk.green(t("allDone")));
  });

program.parse(process.argv);
