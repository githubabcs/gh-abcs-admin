import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
    CanvasError,
    createCanvas,
    joinSession,
} from "@github/copilot-sdk/extension";
import { renderDashboardHtml } from "./renderer.mjs";

const DOC_EXTENSIONS = new Set([".md", ".html"]);
const extensionDirectory = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(extensionDirectory, "..", "..", "..");
const docsRoot = join(repoRoot, "docs");
const servers = new Map();

function normalizePath(filePath) {
    return filePath.split(sep).join("/");
}

function parseFrontmatter(markdown) {
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) {
        return { body: markdown, metadata: {} };
    }

    const metadata = {};
    for (const line of match[1].split(/\r?\n/)) {
        const separator = line.indexOf(":");
        if (separator === -1 || /^\s/.test(line)) {
            continue;
        }

        const key = line.slice(0, separator).trim().toLowerCase();
        const value = line
            .slice(separator + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
        metadata[key] = value;
    }

    return { body: markdown.slice(match[0].length), metadata };
}

function plainText(markdown) {
    return markdown
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[#>*_`~|=-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function firstMarkdownParagraph(body) {
    const blocks = body.split(/\r?\n\s*\r?\n/);
    for (const block of blocks) {
        const trimmed = block.trim();
        if (
            !trimmed ||
            /^#{1,6}\s/.test(trimmed) ||
            /^[-*+]\s/.test(trimmed) ||
            /^\d+\.\s/.test(trimmed) ||
            /^```/.test(trimmed) ||
            /^\|/.test(trimmed) ||
            /^>.*Document status/i.test(trimmed)
        ) {
            continue;
        }

        const text = plainText(trimmed.replace(/^>\s?/gm, ""));
        if (text.length >= 24) {
            return text;
        }
    }
    return "";
}

function categoryFor(title, filePath) {
    const value = `${title} ${filePath}`.toLowerCase();
    if (/(migration|azure devops|\bado\b|importer|pipeline)/.test(value)) {
        return "Migration";
    }
    if (/(copilot|\bai\b|chargeback|billing|package management)/.test(value)) {
        return "AI & FinOps";
    }
    if (/(security|compliance|policy|governance|properties)/.test(value)) {
        return "Security & Governance";
    }
    if (/(identity|access|managed users|permissions|teams)/.test(value)) {
        return "Identity & Access";
    }
    if (/(architecture|best practices|\bwaf\b)/.test(value)) {
        return "Architecture";
    }
    if (/(workshop|faq|training)/.test(value)) {
        return "Learning";
    }
    return "Administration";
}

function extractHtmlMetadata(html, fallbackTitle) {
    const title =
        html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
        html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ||
        fallbackTitle;
    const description =
        html.match(
            /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i,
        )?.[1] ||
        html.match(
            /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i,
        )?.[1] ||
        "";
    return {
        title: plainText(title),
        description: plainText(description),
    };
}

async function documentSummary(fileName) {
    const absolutePath = join(docsRoot, fileName);
    const [content, details] = await Promise.all([
        readFile(absolutePath, "utf8"),
        stat(absolutePath),
    ]);
    const extension = extname(fileName).toLowerCase();
    const fallbackTitle = fileName
        .replace(/\.(md|html)$/i, "")
        .replace(/^\d+[-_]/, "")
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

    let title = fallbackTitle;
    let description = "";
    let headingCount = 0;

    if (extension === ".md") {
        const { body, metadata } = parseFrontmatter(content);
        title =
            metadata.title ||
            body.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "") ||
            fallbackTitle;
        description = metadata.description || firstMarkdownParagraph(body);
        headingCount = (body.match(/^#{1,6}\s+/gm) || []).length;
    } else {
        const metadata = extractHtmlMetadata(content, fallbackTitle);
        title = metadata.title;
        description = metadata.description;
        headingCount = (content.match(/<h[1-6]\b/gi) || []).length;
    }

    const wordCount = plainText(content).split(/\s+/).filter(Boolean).length;
    const path = normalizePath(fileName);
    return {
        path,
        title,
        description:
            description.slice(0, 220) ||
            `${extension === ".md" ? "Markdown" : "HTML"} document in docs/${path}`,
        type: extension === ".md" ? "markdown" : "html",
        category: categoryFor(title, path),
        bytes: details.size,
        modifiedAt: details.mtime.toISOString(),
        headingCount,
        readingMinutes: Math.max(1, Math.ceil(wordCount / 220)),
    };
}

async function indexDocuments() {
    const entries = await readdir(docsRoot, { withFileTypes: true });
    const files = entries
        .filter(
            (entry) =>
                entry.isFile() &&
                DOC_EXTENSIONS.has(extname(entry.name).toLowerCase()),
        )
        .map((entry) => entry.name);
    const documents = await Promise.all(files.map(documentSummary));
    return documents.sort((left, right) =>
        left.path.localeCompare(right.path, undefined, {
            numeric: true,
            sensitivity: "base",
        }),
    );
}

function resolveDocumentPath(requestedPath, expectedExtension) {
    if (typeof requestedPath !== "string" || !requestedPath.trim()) {
        throw new CanvasError("document_path_invalid", "A document path is required.");
    }

    const absolutePath = resolve(docsRoot, requestedPath);
    const relativePath = relative(docsRoot, absolutePath);
    const extension = extname(absolutePath).toLowerCase();
    if (
        relativePath.startsWith("..") ||
        relativePath === "" ||
        !DOC_EXTENSIONS.has(extension) ||
        (expectedExtension && extension !== expectedExtension)
    ) {
        throw new CanvasError(
            "document_path_invalid",
            "The document must be a Markdown or HTML file inside docs/.",
        );
    }
    return { absolutePath, path: normalizePath(relativePath), extension };
}

async function loadDocument(requestedPath) {
    const resolved = resolveDocumentPath(requestedPath);
    try {
        const content = await readFile(resolved.absolutePath, "utf8");
        const summary = await documentSummary(resolved.path);
        return { ...summary, content };
    } catch (error) {
        if (error?.code === "ENOENT") {
            throw new CanvasError(
                "document_not_found",
                `Document not found: ${resolved.path}`,
            );
        }
        throw error;
    }
}

function sendJson(response, statusCode, value) {
    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
    });
    response.end(JSON.stringify(value));
}

function sendText(response, statusCode, contentType, value, extraHeaders = {}) {
    response.writeHead(statusCode, {
        "Cache-Control": "no-store",
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
        ...extraHeaders,
    });
    response.end(value);
}

async function readJsonBody(request) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > 16_384) {
            throw new CanvasError(
                "request_too_large",
                "The request body exceeds 16 KB.",
            );
        }
        chunks.push(chunk);
    }

    if (chunks.length === 0) {
        return {};
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
        throw new CanvasError("request_invalid", "The request body must be valid JSON.");
    }
}

function broadcast(entry, event, value) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(value)}\n\n`;
    for (const client of entry.clients) {
        client.write(payload);
    }
}

async function routeRequest(entry, request, response) {
    const url = new URL(request.url || "/", entry.url || "http://127.0.0.1");

    if (request.method === "GET" && url.pathname === "/") {
        sendText(
            response,
            200,
            "text/html; charset=utf-8",
            renderDashboardHtml(entry.instanceId),
            {
                "Content-Security-Policy":
                    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-src 'self'; img-src 'self' data: https:; font-src 'self'",
            },
        );
        return;
    }

    if (request.method === "GET" && url.pathname === "/api/docs") {
        sendJson(response, 200, {
            documents: await indexDocuments(),
            selectedPath: entry.selectedPath,
        });
        return;
    }

    if (request.method === "GET" && url.pathname === "/api/document") {
        sendJson(response, 200, await loadDocument(url.searchParams.get("path")));
        return;
    }

    if (request.method === "GET" && url.pathname === "/raw") {
        const resolved = resolveDocumentPath(url.searchParams.get("path"), ".html");
        const html = await readFile(resolved.absolutePath, "utf8");
        sendText(response, 200, "text/html; charset=utf-8", html, {
            "Content-Security-Policy":
                "default-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:",
        });
        return;
    }

    if (request.method === "GET" && url.pathname === "/events") {
        response.writeHead(200, {
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Content-Type": "text/event-stream",
            "X-Accel-Buffering": "no",
        });
        response.write(": connected\n\n");
        entry.clients.add(response);
        request.on("close", () => entry.clients.delete(response));
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/select") {
        const body = await readJsonBody(request);
        const document = await loadDocument(body.path);
        entry.selectedPath = document.path;
        sendJson(response, 200, { path: document.path });
        return;
    }

    if (request.method === "POST" && url.pathname === "/api/refresh") {
        const documents = await indexDocuments();
        broadcast(entry, "documents", { documents });
        sendJson(response, 200, { count: documents.length });
        return;
    }

    sendJson(response, 404, { error: "Route not found." });
}

async function startServer(instanceId, selectedPath) {
    const entry = {
        clients: new Set(),
        instanceId,
        selectedPath,
        server: undefined,
        url: undefined,
    };
    const server = createServer((request, response) => {
        void routeRequest(entry, request, response).catch((error) => {
            if (response.headersSent) {
                response.end();
                return;
            }
            sendJson(response, error instanceof CanvasError ? 400 : 500, {
                code: error instanceof CanvasError ? error.code : "internal_error",
                error: error?.message || "The document request failed.",
            });
        });
    });
    entry.server = server;
    await new Promise((resolveListen, rejectListen) => {
        server.once("error", rejectListen);
        server.listen(0, "127.0.0.1", resolveListen);
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    entry.url = `http://127.0.0.1:${port}/`;
    return entry;
}

const dashboardCanvas = createCanvas({
    id: "repository-docs",
    displayName: "Repository docs",
    description:
        "Browse and read the repository's docs/ collection in a GitHub-styled dashboard.",
    inputSchema: {
        type: "object",
        properties: {
            path: {
                type: "string",
                description: "Optional repository-relative path within docs/ to open.",
            },
        },
        additionalProperties: false,
    },
    actions: [
        {
            name: "show_document",
            description: "Open a document from docs/ in the active dashboard.",
            inputSchema: {
                type: "object",
                required: ["path"],
                properties: {
                    path: {
                        type: "string",
                        minLength: 1,
                        description: "Path relative to docs/, such as 10-reference-architecture.md.",
                    },
                },
                additionalProperties: false,
            },
            handler: async (ctx) => {
                const document = await loadDocument(ctx.input.path);
                const entry = servers.get(ctx.instanceId);
                if (!entry) {
                    throw new CanvasError(
                        "canvas_instance_missing",
                        "The dashboard instance is no longer open.",
                    );
                }
                entry.selectedPath = document.path;
                broadcast(entry, "select", { path: document.path });
                return {
                    path: document.path,
                    title: document.title,
                    type: document.type,
                };
            },
        },
        {
            name: "refresh_documents",
            description: "Refresh the docs/ index shown in the dashboard.",
            inputSchema: {
                type: "object",
                additionalProperties: false,
            },
            handler: async (ctx) => {
                const documents = await indexDocuments();
                const entry = servers.get(ctx.instanceId);
                if (entry) {
                    broadcast(entry, "documents", { documents });
                }
                return {
                    count: documents.length,
                    markdown: documents.filter((document) => document.type === "markdown")
                        .length,
                    html: documents.filter((document) => document.type === "html").length,
                };
            },
        },
    ],
    open: async (ctx) => {
        let selectedPath;
        if (ctx.input?.path) {
            selectedPath = (await loadDocument(ctx.input.path)).path;
        }

        let entry = servers.get(ctx.instanceId);
        if (!entry) {
            entry = await startServer(ctx.instanceId, selectedPath);
            servers.set(ctx.instanceId, entry);
        } else if (selectedPath) {
            entry.selectedPath = selectedPath;
        }

        const documents = await indexDocuments();
        return {
            title: "Repository docs",
            status: `${documents.length} documents`,
            url: entry.url,
        };
    },
    onClose: async (ctx) => {
        const entry = servers.get(ctx.instanceId);
        if (!entry) {
            return;
        }
        servers.delete(ctx.instanceId);
        for (const client of entry.clients) {
            client.end();
        }
        await new Promise((resolveClose) => entry.server.close(resolveClose));
    },
});

await joinSession({ canvases: [dashboardCanvas] });
