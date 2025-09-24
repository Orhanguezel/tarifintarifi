#!/usr/bin/env bun

import fs from "fs";
import { glob } from "glob"; // ✅ DÜZELTME

const files = await glob("src/app/**/*.tsx"); // ✅ await ile kullan

files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");

    if (
        content.includes('"use client"') &&
        !content.includes("import React") &&
        !content.includes("from 'react'") &&
        !content.includes('from "react"')
    ) {
        const lines = content.split("\n");
        const insertIndex = lines.findIndex((line) =>
            line.includes('"use client"')
        );

        if (insertIndex !== -1) {
            lines.splice(insertIndex + 1, 0, 'import React from "react";');
            fs.writeFileSync(file, lines.join("\n"), "utf8");
            console.log(`✅ React import eklendi: ${file}`);
        }
    }
});

