exports.dependencies = {
  // 需要检查的依赖
  "cz-git": "^1.9.4",
  commitizen: "^4.3.0",
  "conventional-changelog-cli": "^5.0.0",
};

exports.scripts = {
  // 需要检查的命令
  commit: "git-cz",
  changelog:
    "conventional-changelog --config ./commit-config/changelog-config.js -p angular -i -o CHANGELOG.md -r 1",
  version:
    "conventional-changelog --config ./commit-config/changelog-config.js -p angular -i -o CHANGELOG.md && git add CHANGELOG.md",
};

exports.config = {
  // 需要检查的配置
  commitizen: {
    path: "node_modules/cz-git",
    czConfig: "./commit-config/cz-config.js",
  },
};

exports.copyFiles = [
  {
    src: ["templates", "commit-config"],
    dest: "commit-config",
  },
  // {
  //     src: ["templates", "fileOne.js"],
  //     dest: "fileOne.js",
  // },
];

exports.installCommands = {
  pnpm: "pnpm install",
  yarn: "yarn install",
  npm: "npm install",
};
