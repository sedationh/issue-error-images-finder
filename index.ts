import { config } from "dotenv";
import { writeFileSync } from "fs";

config();

// 读取环境变量
const token = process.env.GITHUB_TOKEN;
const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

// 设置请求头
const headers = {
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json",
};

// 发送请求获取所有 issues
async function getIssues() {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    { headers }
  );

  if (response.ok) {
    const issues = await response.json();
    for (const issue of issues) {
      console.log(`Issue #${issue.number}: ${issue.title}`);
      await getIssueDetails(issue.number);
    }
  } else {
    console.log(`Failed to fetch issues: ${response.status}`);
  }

  // 将 output 写入到文件中
  if (output.length > 0) {
    writeFileSync("output", output.join("\n"));
  }
}

// 发送请求获取单个 issue 的详细内容
async function getIssueDetails(issueNumber: number) {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
    { headers }
  );

  if (response.ok) {
    const issue = await response.json();
    const imageUrls = extractImageUrls(issue.body);
    for (const url of imageUrls) {
      await checkImageUrl(url);
    }
  } else {
    console.log(`Failed to fetch issue #${issueNumber}: ${response.status}`);
  }
}

// 从文本中提取所有图片 URL
function extractImageUrls(text: string): string[] {
  const urlRegex = /!\[.*?\]\((https?:\/\/[^\s]+)\)/g;
  const matches = [...text.matchAll(urlRegex)];
  return matches.map((match) => match[1]);
}

// 声明 output 变量来存储有问题的图片 URL
let output: string[] = [];

// 检查图片 URL 是否还能访问，增加重试逻辑
async function checkImageUrl(url: string, retries: number = 3) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      console.log(`Image URL is accessible: ${url}`);
    } else {
      console.log(
        `Image URL is not accessible: ${url} - Status: ${response.status}`
      );
      // 将有问题的图片 URL 添加到 output 中
      output.push(`${url} - Status: ${response.status}`);
    }
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      await checkImageUrl(url, retries - 1);
    } else {
      console.log(
        `Failed to fetch image URL: ${url} - Error: ${error.message}`
      );
      output.push(`${url} - Error: ${error.message}`);
    }
  }
}

getIssues();