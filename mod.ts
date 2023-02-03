#!/usr/bin/env -S deno run --unstable --allow-net --allow-read --allow-write --import-map=import_map.json
// Copyright 2023 Seiri. All rights reserved. MIT license.
import { format } from "std/datetime/mod.ts";
import { join } from "std/path/mod.ts";
import { exists } from "std/fs/mod.ts";

import type { HotList, Question } from "./types.ts";
import { createArchive, createReadme, mergeQuestions } from "./utils.ts";

const response = await fetch(
  "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=100",
);

if (!response.ok) {
  console.error(response.statusText);
  Deno.exit(-1);
}
//search result
const result: HotList = await response.json();
// article data {url: url, title:title }
const questions: Question[] = result.data.map((x) => ({
  title: x.target.title,
  url: `https://www.zhihu.com/question/${x.target.id}`,
}));
// date format
const yyyyMMdd = format(new Date(), "yyyy-MM-dd");
//json path
const fullPath = join("raw", `${yyyyMMdd}.json`);
//origin data
let questionsAlreadyDownload: Question[] = [];
if (await exists(fullPath)) {
  const content = await Deno.readTextFile(fullPath);
  questionsAlreadyDownload = JSON.parse(content);
}
// save origin data
const questionsAll = mergeQuestions(questions, questionsAlreadyDownload);
await Deno.writeTextFile(fullPath, JSON.stringify(questionsAll));
// update README.md
const readme = await createReadme(questionsAll);
await Deno.writeTextFile("./README.md", readme);
// update archives
const archiveText = createArchive(questionsAll, yyyyMMdd);
const archivePath = join("archives", `${yyyyMMdd}.md`);
await Deno.writeTextFile(archivePath, archiveText);
