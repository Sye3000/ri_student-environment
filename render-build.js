/*
 * RI Student Environment
 * Render public demonstration build
 *
 * Source files remain untouched.
 * Render publishes the generated dist/ directory.
 */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DIST = path.join(ROOT, "dist");

const PUBLIC_URL = "https://ri-student-environment.onrender.com";

const EXCLUDED = new Set([
    ".git",
    ".vscode",
    "node_modules",
    "backups",
    "dist",
    "INSTALL.sh",
    "api-test.html",
    "README.md",
    "CHANGELOG.md",
    "render-build.js",
    "Untitled.jpeg",
    "conferenc.jpeg",
    "scuba.jpeg"
]);

const PUBLIC_PAGES = [
    "index.html",
    "about.html",
    "programs.html",
    "events.html",
    "src.html",
    "impact.html",
    "contact.html",
    "enquiry.html",
    "campus-nav.html"
];

function shouldExclude(name) {
    return (
        EXCLUDED.has(name) ||
        name.startsWith(".") ||
        /\.zip$/i.test(name) ||
        /\.swp$/i.test(name) ||
        /\.backup($|[-.])/i.test(name) ||
        /\.before-/i.test(name) ||
        /\.part3-/i.test(name) ||
        /^\.env/i.test(name)
    );
}

function copyTree(source, destination) {
    fs.mkdirSync(destination, { recursive: true });

    for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        const name = entry.name;

        if (shouldExclude(name)) continue;

        const src = path.join(source, name);
        const dest = path.join(destination, name);

        if (entry.isDirectory()) {
            copyTree(src, dest);
        } else if (entry.isFile()) {
            fs.copyFileSync(src, dest);
        }
    }
}

function replacePrivateAddresses(content) {
    return content
        .replace(
            /http:\/\/192\.168\.122\.10:3000\/api\/community/g,
            "/api/community"
        )
        .replace(
            /http:\/\/192\.168\.122\.10:3000\/api/g,
            "/api"
        )
        .replace(
            /http:\/\/192\.168\.122\.10:3000/g,
            ""
        );
}

function prepareConfig() {
    return `/*
 * Public demonstration configuration.
 * The original local ri-config.js is not changed.
 */
const RI_CONFIG = {
    API_BASE_URL: "",
    DEMO_MODE: true,
    DEMO_MESSAGE: "This feature requires the private RI backend and is unavailable in the public demonstration."
};
`;
}

function prepareApiClient(content) {
    const marker = "async request(endpoint, options = {}) {";

    const replacement = `${marker}
        if (
            typeof RI_CONFIG !== "undefined" &&
            RI_CONFIG.DEMO_MODE
        ) {
            throw new Error(
                RI_CONFIG.DEMO_MESSAGE ||
                "The backend is unavailable in this public demonstration."
            );
        }
`;

    if (!content.includes(marker)) {
        throw new Error("Could not locate RI_API.request in ri-api.js");
    }

    return content.replace(marker, replacement);
}

function prepareEvents(content) {
    const loginGate =
        /if\s*\(!token\)\s*\{\s*window\.location\.href\s*=\s*"login\.html";\s*return;\s*\}/;

    const publicPreview = `if (RI_CONFIG.DEMO_MODE) {

        // Clearly illustrative records for the public demonstration.
        allEvents = [
            {
                event_id: "demo-001",
                title: "Student Technology Showcase",
                description: "Explore innovative student projects, technology demonstrations and practical IT solutions.",
                event_date: "2026-11-14",
                start_time: "10:00:00",
                end_time: "14:00:00",
                location: "Innovation Hub",
                campus_name: "Demonstration Campus",
                category: "Technology"
            },
            {
                event_id: "demo-002",
                title: "Career Networking Session",
                description: "Explore career paths, practise professional networking and learn about the world of work.",
                event_date: "2026-11-19",
                start_time: "11:00:00",
                end_time: "13:00:00",
                location: "Student Centre",
                campus_name: "Demonstration Campus",
                category: "Career"
            },
            {
                event_id: "demo-003",
                title: "Student Innovation Challenge",
                description: "A sample competition where students can present creative ideas and demonstrate problem-solving skills.",
                event_date: "2026-11-25",
                start_time: "09:00:00",
                end_time: "15:00:00",
                location: "Main Hall",
                campus_name: "Demonstration Campus",
                category: "Competition"
            },
            {
                event_id: "demo-004",
                title: "Collaborative Study Workshop",
                description: "Develop effective study habits, exchange ideas and learn collaboratively with fellow students.",
                event_date: "2026-12-03",
                start_time: "12:00:00",
                end_time: "14:00:00",
                location: "Library",
                campus_name: "Demonstration Campus",
                category: "Academic"
            },
            {
                event_id: "demo-005",
                title: "Campus Community Day",
                description: "Discover student activities, connect with campus groups and explore ways to participate in campus life.",
                event_date: "2026-12-10",
                start_time: "10:00:00",
                end_time: "15:00:00",
                location: "Campus Grounds",
                campus_name: "Demonstration Campus",
                category: "Community"
            }
        ];

        const eventsList = document.getElementById("events-list");

        if (
            eventsList &&
            !document.getElementById("event-demo-disclaimer")
        ) {
            const note = document.createElement("div");
            note.id = "event-demo-disclaimer";
            note.className = "event-empty-message";
            note.setAttribute("role", "note");

            note.innerHTML =
                "<h3>Illustrative demonstration events</h3>" +
                "<p>These sample listings demonstrate the event search and " +
                "filtering features. They are not confirmed RI events, and " +
                "registration is not available in this public demonstration.</p>";

            eventsList.parentNode.insertBefore(note, eventsList);
        }

        populateEventCategories(allEvents);
        applyEventFilters();
        return;
    }

    if (!token) {
        window.location.href = "login.html";
        return;
    }`;

    if (!loginGate.test(content)) {
        throw new Error("Could not locate the Events login gate.");
    }

    content = content.replace(loginGate, publicPreview);

    // Event details require the private backend, so disable that action
    // in the generated public demonstration build.
    const eventLink =
        /<a href="event\.html\?id=\$\{event\.event_id\}">\s*View →\s*<\/a>/;

    if (!eventLink.test(content)) {
        throw new Error("Could not locate the event-detail link.");
    }

    return content.replace(
        eventLink,
        '<span class="event-demo-only">Demo preview</span>'
    );
}

function prepareHomepage(content) {
    content = content.replace(
        /all eight RI campuses/gi,
        "RI campuses"
    );

    content = content.replace(
        /all three RI campuses/gi,
        "RI campuses"
    );

    content = content.replace(
        /all three campuses/gi,
        "RI campuses"
    );

    content = content.replace(
        "Campus Activity — Live",
        "Sample Campus Activity"
    );

    content = content.replace(
        "What's happening today",
        "Example campus activities"
    );

    content = content.replace(
        "5000+ students registered",
        "Student platform demonstration"
    );

    content = content.replace(
        "Next Event:</strong> End of the Year Bash",
        "Example event:</strong> End of the Year Bash"
    );

    content = content.replace(
        /Discover over 40 opportunities designed to help/,
        "Explore student opportunities designed to help"
    );

    const stats = /<div class="hero-stats">[\s\S]*?<\/div>\s*<\/div>/;

    const replacement = `
            <div class="hero-stats">
                <div>
                    <strong>Discover</strong>
                    <span>Programmes</span>
                </div>
                <div>
                    <strong>Connect</strong>
                    <span>Community</span>
                </div>
                <div>
                    <strong>Participate</strong>
                    <span>Campus life</span>
                </div>
            </div>
        </div>`;

    if (!stats.test(content)) {
        throw new Error("Could not locate homepage statistics.");
    }

    return content.replace(stats, replacement);
}

function addDemoNotice(content, relativePagePath) {
    const scriptPath = path
        .relative(
            path.dirname(relativePagePath),
            "public-demo.js"
        )
        .split(path.sep)
        .join("/");

    const tag = `<script src="${scriptPath}"></script>`;

    if (content.includes("public-demo.js")) return content;

    if (!/<\/body>/i.test(content)) {
        throw new Error(`No closing body tag in ${relativePagePath}`);
    }

    return content.replace(
        /<\/body>/i,
        `    ${tag}\n</body>`
    );
}

function generateRobots() {
    return `User-agent: *
Allow: /

Disallow: /admin.html
Disallow: /dashboard.html
Disallow: /student-dashboard.html
Disallow: /src-dashboard.html
Disallow: /student-requests.html
Disallow: /api-test.html

Sitemap: ${PUBLIC_URL}/sitemap.xml
`;
}

function generateSitemap() {
    const pages = PUBLIC_PAGES
        .filter(page => fs.existsSync(path.join(DIST, page)))
        .map(page => {
            const location =
                page === "index.html"
                    ? `${PUBLIC_URL}/`
                    : `${PUBLIC_URL}/${page}`;

            return `    <url><loc>${location}</loc></url>`;
        })
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages}
</urlset>
`;
}

function createPublicNotice() {
    return `/*
 * Public demonstration notice.
 * No backend or student data is connected by this script.
 */
(() => {
    function showNotice() {
        if (!document.body ||
            document.getElementById("ri-public-demo-notice")) {
            return;
        }

        const notice = document.createElement("aside");
        notice.id = "ri-public-demo-notice";
        notice.setAttribute("role", "note");
        notice.setAttribute("aria-label", "Public demonstration notice");

        notice.innerHTML = \`
            <strong>RI STUDENT ENVIRONMENT · PUBLIC DEMO</strong>
            <span>
                Educational prototype and portfolio demonstration.
                Login, live events, profiles, uploads and transactions
                are not connected to a public backend.
                Please do not enter real student, personal or payment information.
            </span>
        \`;

        Object.assign(notice.style, {
            position: "relative",
            zIndex: "99999",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "7px 14px",
            padding: "12px 18px",
            background: "#12284c",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            fontSize: "13px",
            lineHeight: "1.55",
            textAlign: "center",
            borderBottom: "3px solid #ff7a1a"
        });

        const strong = notice.querySelector("strong");
        Object.assign(strong.style, {
            color: "#ffb36f",
            letterSpacing: "0.04em"
        });

        document.body.insertBefore(notice, document.body.firstChild);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", showNotice);
    } else {
        showNotice();
    }
})();
`;
}

function processFiles(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            processFiles(fullPath);
            continue;
        }

        if (!/\.(html|js|css|txt)$/i.test(entry.name)) continue;

        let content = fs.readFileSync(fullPath, "utf8");
        const relative = path.relative(DIST, fullPath);

        content = replacePrivateAddresses(content);

        if (entry.name === "ri-config.js") {
            content = prepareConfig();
        }

        if (entry.name === "ri-api.js") {
            content = prepareApiClient(content);
        }

        if (entry.name === "events.js") {
            content = prepareEvents(content);
        }

        if (relative === "index.html") {
            content = prepareHomepage(content);
        }

        if (entry.name.endsWith(".html")) {
            content = addDemoNotice(content, relative);

            if (
                /^(login|register|profile|admin|dashboard|student-dashboard|src-dashboard|student-requests|ewallet|api-test)\.html$/i.test(entry.name) &&
                !/name=["']robots["']/i.test(content)
            ) {
                content = content.replace(
                    /<\/head>/i,
                    '<meta name="robots" content="noindex, nofollow">\n</head>'
                );
            }
        }

        fs.writeFileSync(fullPath, content);
    }
}

function verifyNoPrivateAddresses() {
    const forbidden = /192\.168\.\d{1,3}\.\d{1,3}|localhost:3000|localhost:5000/i;

    function scan(directory) {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const target = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                scan(target);
            } else if (/\.(html|js|css)$/i.test(entry.name)) {
                const text = fs.readFileSync(target, "utf8");

                if (forbidden.test(text)) {
                    throw new Error(
                        `Private/local network address remains in public build: ${path.relative(DIST, target)}`
                    );
                }
            }
        }
    }

    scan(DIST);
}

function main() {
    fs.rmSync(DIST, { recursive: true, force: true });
    fs.mkdirSync(DIST, { recursive: true });

    copyTree(ROOT, DIST);

    const configPath = path.join(DIST, "ri-config.js");
    if (!fs.existsSync(configPath)) {
        throw new Error("ri-config.js was not copied into dist.");
    }

    const apiPath = path.join(DIST, "ri-api.js");
    if (!fs.existsSync(apiPath)) {
        throw new Error("ri-api.js was not copied into dist.");
    }

    const publicNoticePath = path.join(DIST, "public-demo.js");
    fs.writeFileSync(publicNoticePath, createPublicNotice());

    processFiles(DIST);

    fs.writeFileSync(
        path.join(DIST, "robots.txt"),
        generateRobots()
    );

    fs.writeFileSync(
        path.join(DIST, "sitemap.xml"),
        generateSitemap()
    );

    verifyNoPrivateAddresses();

    console.log("Public demo build completed.");
    console.log(`Published directory: ${DIST}`);
    console.log("Private network addresses: none found.");
    console.log("Demo notice: added to HTML pages.");
    console.log("Sitemap and robots.txt: generated.");
}

try {
    main();
} catch (error) {
    console.error("Public demo build failed:", error.message);
    process.exit(1);
}
