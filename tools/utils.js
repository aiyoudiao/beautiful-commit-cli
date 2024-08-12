const fs = require("fs-extra");
const path = require("path");
const inquirer = require("inquirer");
const ora = require("ora");
const chalk = require("chalk");

// 封装复制目录的函数
async function copyDirectoryWithOverwrite(srcDir, destDir, t) {
  const spinner = ora();

  async function copyFile(src, dest) {
    if (!fs.existsSync(dest)) {
      spinner.start(`${t("copying")} ${src} ${t("to")} ${dest}...`);
      try {
        fs.copySync(src, dest);
        spinner.succeed(`${t("copied")} ${src} ${t("to")} ${dest}`);
      } catch (error) {
        spinner.fail(`${t("failedToCopy")} ${src} ${t("to")} ${dest}`);
        console.error(error);
      }
    } else {
      const sourceContent = fs.readFileSync(src, "utf-8");
      const targetContent = fs.readFileSync(dest, "utf-8");
      if (sourceContent !== targetContent) {
        const answers = await inquirer.prompt([
          {
            type: "confirm",
            name: "overwrite",
            message: `${dest} ${t("overwritePrompt")}`,
            default: false,
          },
        ]);
        if (answers.overwrite) {
          spinner.start(`${t("overwriting")} ${dest}...`);
          try {
            fs.copySync(src, dest);
            spinner.succeed(`${t("overwritten")} ${dest}`);
          } catch (error) {
            spinner.fail(`${t("failedToCopy")} ${dest}`);
            console.error(error);
          }
        } else {
          console.log(chalk.green(`${t("skipping")} ${dest}...`));
        }
      }
    }
  }

  function copyDirectory(src, dest) {
    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcItem = path.join(src, item);
      const destItem = path.join(dest, item);
      if (fs.lstatSync(srcItem).isDirectory()) {
        if (!fs.existsSync(destItem)) {
          fs.mkdirSync(destItem);
        }
        copyDirectory(srcItem, destItem);
      } else {
        copyFile(srcItem, destItem);
      }
    }
  }

  // 开始复制目录
  copyDirectory(srcDir, destDir);
}


    // 检查包管理工具
function detectPackageManager(targetPath) {
      if (fs.existsSync(path.join(targetPath, "pnpm-lock.yaml"))) {
        return "pnpm";
      } else if (fs.existsSync(path.join(targetPath, "yarn.lock"))) {
        return "yarn";
      } else if (fs.existsSync(path.join(targetPath, "package-lock.json"))) {
        return "npm";
      } else {
        // 默认使用 npm
        return "npm";
      }
    }


module.exports = { copyDirectoryWithOverwrite, detectPackageManager };
