import e$3 from'fs';import e$2 from'path';import r$5 from'fast-glob';import {createRequire}from'module';import t$2 from'process';import e$4 from'os';import o$1 from'tty';import {coerce,lt}from'semver';import {fileURLToPath}from'url';import e$5 from'crypto';import o$2 from'workbox-webpack-plugin';const findFirstTruthy = (t, r)=>{
    for (let e of t){
        let t = r(e);
        if (t) return t;
    }
};let r$4 = createRequire(import.meta.url);
const getPackageVersion = (e)=>{
    try {
        return r$4(`${e}/package.json`).version;
    } catch  {
        return;
    }
};const loadTSConfig = (n, e)=>{
    try {
        let i = findFirstTruthy([
            e ?? "tsconfig.json",
            "jsconfig.json"
        ], (o)=>{
            let e = e$2.join(n, o);
            return e$3.existsSync(e) ? e : void 0;
        });
        if (!i) return;
        return JSON.parse(e$3.readFileSync(i, "utf-8"));
    } catch  {
        return;
    }
};let e$1 = (e = 0)=>(r)=>`\u001B[${r + e}m`, r$3 = (e = 0)=>(r)=>`\u001B[${38 + e};5;${r}m`, o = (e = 0)=>(r, o, t)=>`\u001B[${38 + e};2;${r};${o};${t}m`, t$1 = {
    modifier: {
        reset: [
            0,
            0
        ],
        bold: [
            1,
            22
        ],
        dim: [
            2,
            22
        ],
        italic: [
            3,
            23
        ],
        underline: [
            4,
            24
        ],
        overline: [
            53,
            55
        ],
        inverse: [
            7,
            27
        ],
        hidden: [
            8,
            28
        ],
        strikethrough: [
            9,
            29
        ]
    },
    color: {
        black: [
            30,
            39
        ],
        red: [
            31,
            39
        ],
        green: [
            32,
            39
        ],
        yellow: [
            33,
            39
        ],
        blue: [
            34,
            39
        ],
        magenta: [
            35,
            39
        ],
        cyan: [
            36,
            39
        ],
        white: [
            37,
            39
        ],
        blackBright: [
            90,
            39
        ],
        gray: [
            90,
            39
        ],
        grey: [
            90,
            39
        ],
        redBright: [
            91,
            39
        ],
        greenBright: [
            92,
            39
        ],
        yellowBright: [
            93,
            39
        ],
        blueBright: [
            94,
            39
        ],
        magentaBright: [
            95,
            39
        ],
        cyanBright: [
            96,
            39
        ],
        whiteBright: [
            97,
            39
        ]
    },
    bgColor: {
        bgBlack: [
            40,
            49
        ],
        bgRed: [
            41,
            49
        ],
        bgGreen: [
            42,
            49
        ],
        bgYellow: [
            43,
            49
        ],
        bgBlue: [
            44,
            49
        ],
        bgMagenta: [
            45,
            49
        ],
        bgCyan: [
            46,
            49
        ],
        bgWhite: [
            47,
            49
        ],
        bgBlackBright: [
            100,
            49
        ],
        bgGray: [
            100,
            49
        ],
        bgGrey: [
            100,
            49
        ],
        bgRedBright: [
            101,
            49
        ],
        bgGreenBright: [
            102,
            49
        ],
        bgYellowBright: [
            103,
            49
        ],
        bgBlueBright: [
            104,
            49
        ],
        bgMagentaBright: [
            105,
            49
        ],
        bgCyanBright: [
            106,
            49
        ],
        bgWhiteBright: [
            107,
            49
        ]
    }
};
Object.keys(t$1.modifier);
const foregroundColorNames = Object.keys(t$1.color);
const backgroundColorNames = Object.keys(t$1.bgColor);
[
    ...foregroundColorNames,
    ...backgroundColorNames
];
let n$2 = function() {
    let n = new Map();
    for (let [e, r] of Object.entries(t$1)){
        for (let [e, o] of Object.entries(r))t$1[e] = {
            open: `\u001B[${o[0]}m`,
            close: `\u001B[${o[1]}m`
        }, r[e] = t$1[e], n.set(o[0], o[1]);
        Object.defineProperty(t$1, e, {
            value: r,
            enumerable: !1
        });
    }
    return Object.defineProperty(t$1, 'codes', {
        value: n,
        enumerable: !1
    }), t$1.color.close = '\u001B[39m', t$1.bgColor.close = '\u001B[49m', t$1.color.ansi = e$1(), t$1.color.ansi256 = r$3(), t$1.color.ansi16m = o(), t$1.bgColor.ansi = e$1(10), t$1.bgColor.ansi256 = r$3(10), t$1.bgColor.ansi16m = o(10), Object.defineProperties(t$1, {
        rgbToAnsi256: {
            value: (e, r, o)=>e === r && r === o ? e < 8 ? 16 : e > 248 ? 231 : Math.round((e - 8) / 247 * 24) + 232 : 16 + 36 * Math.round(e / 255 * 5) + 6 * Math.round(r / 255 * 5) + Math.round(o / 255 * 5),
            enumerable: !1
        },
        hexToRgb: {
            value (e) {
                let r = /[a-f\d]{6}|[a-f\d]{3}/i.exec(e.toString(16));
                if (!r) return [
                    0,
                    0,
                    0
                ];
                let [o] = r;
                3 === o.length && (o = [
                    ...o
                ].map((e)=>e + e).join(''));
                let t = Number.parseInt(o, 16);
                return [
                    t >> 16 & 0xFF,
                    t >> 8 & 0xFF,
                    0xFF & t
                ];
            },
            enumerable: !1
        },
        hexToAnsi256: {
            value: (e)=>t$1.rgbToAnsi256(...t$1.hexToRgb(e)),
            enumerable: !1
        },
        ansi256ToAnsi: {
            value (e) {
                let r, o, t;
                if (e < 8) return 30 + e;
                if (e < 16) return 90 + (e - 8);
                if (e >= 232) o = r = ((e - 232) * 10 + 8) / 255, t = r;
                else {
                    let n = (e -= 16) % 36;
                    r = Math.floor(e / 36) / 5, o = Math.floor(n / 6) / 5, t = n % 6 / 5;
                }
                let n = 2 * Math.max(r, o, t);
                if (0 === n) return 30;
                let l = 30 + (Math.round(t) << 2 | Math.round(o) << 1 | Math.round(r));
                return 2 === n && (l += 60), l;
            },
            enumerable: !1
        },
        rgbToAnsi: {
            value: (e, r, o)=>t$1.ansi256ToAnsi(t$1.rgbToAnsi256(e, r, o)),
            enumerable: !1
        },
        hexToAnsi: {
            value: (e)=>t$1.ansi256ToAnsi(t$1.hexToAnsi256(e)),
            enumerable: !1
        }
    }), t$1;
}();let r$2;
function i$3(r, e = globalThis.Deno ? globalThis.Deno.args : t$2.argv) {
    let o = r.startsWith('-') ? '' : 1 === r.length ? '-' : '--', n = e.indexOf(o + r), l = e.indexOf('--');
    return -1 !== n && (-1 === l || n < l);
}
let { env: n$1 } = t$2;
i$3('no-color') || i$3('no-colors') || i$3('color=false') || i$3('color=never') ? r$2 = 0 : (i$3('color') || i$3('colors') || i$3('color=true') || i$3('color=always')) && (r$2 = 1);
function createSupportsColor(o, l = {}) {
    var s;
    return 0 !== (s = function(o, { streamIsTTY: l, sniffFlags: s = !0 } = {}) {
        let u = function() {
            if ('FORCE_COLOR' in n$1) return 'true' === n$1.FORCE_COLOR ? 1 : 'false' === n$1.FORCE_COLOR ? 0 : 0 === n$1.FORCE_COLOR.length ? 1 : Math.min(Number.parseInt(n$1.FORCE_COLOR, 10), 3);
        }();
        void 0 !== u && (r$2 = u);
        let R = s ? r$2 : u;
        if (0 === R) return 0;
        if (s) {
            if (i$3('color=16m') || i$3('color=full') || i$3('color=truecolor')) return 3;
            if (i$3('color=256')) return 2;
        }
        if ('TF_BUILD' in n$1 && 'AGENT_NAME' in n$1) return 1;
        if (o && !l && void 0 === R) return 0;
        let T = R || 0;
        if ('dumb' === n$1.TERM) return T;
        if ('win32' === t$2.platform) {
            let r = e$4.release().split('.');
            return Number(r[0]) >= 10 && Number(r[2]) >= 10_586 ? Number(r[2]) >= 14_931 ? 3 : 2 : 1;
        }
        if ('CI' in n$1) return 'GITHUB_ACTIONS' in n$1 || 'GITEA_ACTIONS' in n$1 ? 3 : [
            'TRAVIS',
            'CIRCLECI',
            'APPVEYOR',
            'GITLAB_CI',
            'BUILDKITE',
            'DRONE'
        ].some((r)=>r in n$1) || 'codeship' === n$1.CI_NAME ? 1 : T;
        if ('TEAMCITY_VERSION' in n$1) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(n$1.TEAMCITY_VERSION) ? 1 : 0;
        if ('truecolor' === n$1.COLORTERM || 'xterm-kitty' === n$1.TERM) return 3;
        if ('TERM_PROGRAM' in n$1) {
            let r = Number.parseInt((n$1.TERM_PROGRAM_VERSION || '').split('.')[0], 10);
            switch(n$1.TERM_PROGRAM){
                case 'iTerm.app':
                    return r >= 3 ? 3 : 2;
                case 'Apple_Terminal':
                    return 2;
            }
        }
        return /-256(color)?$/i.test(n$1.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(n$1.TERM) || 'COLORTERM' in n$1 ? 1 : T;
    }(o, {
        streamIsTTY: o && o.isTTY,
        ...l
    })) && {
        level: s,
        hasBasic: !0,
        has256: s >= 2,
        has16m: s >= 3
    };
}
let l$3 = {
    stdout: createSupportsColor({
        isTTY: o$1.isatty(1)
    }),
    stderr: createSupportsColor({
        isTTY: o$1.isatty(2)
    })
};function stringReplaceAll(e, n, i) {
    let t = e.indexOf(n);
    if (-1 === t) return e;
    let l = n.length, r = 0, c = '';
    do c += e.slice(r, t) + n + i, r = t + l, t = e.indexOf(n, r);
    while (-1 !== t)
    return c + e.slice(r);
}
function stringEncaseCRLFWithFirstIndex(e, n, i, t) {
    let l = 0, r = '';
    do {
        let c = '\r' === e[t - 1];
        r += e.slice(l, c ? t - 1 : t) + n + (c ? '\r\n' : '\n') + i, l = t + 1, t = e.indexOf('\n', l);
    }while (-1 !== t)
    return r + e.slice(l);
}let { stdout: l$2, stderr: s } = l$3, i$2 = Symbol('GENERATOR'), n = Symbol('STYLER'), a$1 = Symbol('IS_EMPTY'), u = [
    'ansi',
    'ansi',
    'ansi256',
    'ansi16m'
], p$1 = Object.create(null), c = (e, t = {})=>{
    if (t.level && !(Number.isInteger(t.level) && t.level >= 0 && t.level <= 3)) throw Error('The `level` option should be an integer from 0 to 3');
    let o = l$2 ? l$2.level : 0;
    e.level = void 0 === t.level ? o : t.level;
};
let f = (e)=>{
    let t = (...e)=>e.join(' ');
    return c(t, e), Object.setPrototypeOf(t, b.prototype), t;
};
function b(e) {
    return f(e);
}
for (let [t, o] of (Object.setPrototypeOf(b.prototype, Function.prototype), Object.entries(n$2)))p$1[t] = {
    get () {
        let e = v(this, h(o.open, o.close, this[n]), this[a$1]);
        return Object.defineProperty(this, t, {
            value: e
        }), e;
    }
};
p$1.visible = {
    get () {
        let e = v(this, this[n], !0);
        return Object.defineProperty(this, 'visible', {
            value: e
        }), e;
    }
};
let d = (t, o, r, ...l)=>'rgb' === t ? 'ansi16m' === o ? n$2[r].ansi16m(...l) : 'ansi256' === o ? n$2[r].ansi256(n$2.rgbToAnsi256(...l)) : n$2[r].ansi(n$2.rgbToAnsi(...l)) : 'hex' === t ? d('rgb', o, r, ...n$2.hexToRgb(...l)) : n$2[r][t](...l);
for (let t of [
    'rgb',
    'hex',
    'ansi256'
])p$1[t] = {
    get () {
        let { level: o } = this;
        return function(...r) {
            return v(this, h(d(t, u[o], 'color', ...r), n$2.color.close, this[n]), this[a$1]);
        };
    }
}, p$1['bg' + t[0].toUpperCase() + t.slice(1)] = {
    get () {
        let { level: o } = this;
        return function(...r) {
            return v(this, h(d(t, u[o], 'bgColor', ...r), n$2.bgColor.close, this[n]), this[a$1]);
        };
    }
};
let m = Object.defineProperties(()=>{}, {
    ...p$1,
    level: {
        enumerable: !0,
        get () {
            return this[i$2].level;
        },
        set (e) {
            this[i$2].level = e;
        }
    }
}), h = (e, t, o)=>{
    let r, l;
    return void 0 === o ? (r = e, l = t) : (r = o.openAll + e, l = t + o.closeAll), {
        open: e,
        close: t,
        openAll: r,
        closeAll: l,
        parent: o
    };
}, v = (e, t, o)=>{
    let r = (...e)=>g(r, 1 === e.length ? '' + e[0] : e.join(' '));
    return Object.setPrototypeOf(r, m), r[i$2] = e, r[n] = t, r[a$1] = o, r;
}, g = (e, t)=>{
    if (e.level <= 0 || !t) return e[a$1] ? '' : t;
    let l = e[n];
    if (void 0 === l) return t;
    let { openAll: s, closeAll: i } = l;
    if (t.includes('\u001B')) for(; void 0 !== l;)t = stringReplaceAll(t, l.close, l.open), l = l.parent;
    let u = t.indexOf('\n');
    return -1 !== u && (t = stringEncaseCRLFWithFirstIndex(t, i, s, u)), s + t + i;
};
Object.defineProperties(b.prototype, p$1);
let y = f(void 0);
f({
    level: s ? s.level : 0
});
var r$1 = y;let a = coerce(getPackageVersion("next")), t = !!a && lt(a, "13.4.1"), w = !!a && lt(a, "13.4.20"), i$1 = {
    wait: "log",
    error: "error",
    warn: "warn",
    info: "log",
    event: "log"
}, l$1 = t ? {
    wait: `${r$1.cyan("wait")}  - (PWA)`,
    error: `${r$1.red("error")} - (PWA)`,
    warn: `${r$1.yellow("warn")}  - (PWA)`,
    info: `${r$1.cyan("info")}  - (PWA)`,
    event: `${r$1.cyan("info")}  - (PWA)`
} : w ? {
    wait: `- ${r$1.cyan("wait")} (pwa)`,
    error: `- ${r$1.red("error")} (pwa)`,
    warn: `- ${r$1.yellow("warn")} (pwa)`,
    info: `- ${r$1.cyan("info")} (pwa)`,
    event: `- ${r$1.cyan("info")} (pwa)`
} : {
    wait: `${r$1.white(r$1.bold("\u25CB"))} (pwa)`,
    error: `${r$1.red(r$1.bold("X"))} (pwa)`,
    warn: `${r$1.yellow(r$1.bold("\u26A0"))} (pwa)`,
    info: `${r$1.white(r$1.bold("\u25CB"))} (pwa)`,
    event: `${r$1.green(r$1.bold("\u2713"))} (pwa)`
}, p = (r, ...o)=>{
    let e = i$1[r], n = l$1[r];
    if (w) return console[e](n, ...o);
    ("" === o[0] || void 0 === o[0]) && 1 === o.length && o.shift(), 0 === o.length ? console[e]("") : console[e](` ${n}`, ...o);
};
const info = (...r)=>{
    p("info", ...r);
};
const event = (...r)=>{
    p("event", ...r);
};const normalizePathSep = (e)=>e.replace(/\\/g, "/");function relativeToOutputPath$1(e, r) {
    return e$2.resolve(r) === e$2.normalize(r) ? normalizePathSep(e$2.relative(e.options.output.path, r)) : normalizePathSep(r);
}let e = [
    {
        urlPattern: /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
            cacheName: "google-fonts-webfonts",
            expiration: {
                maxEntries: 4,
                maxAgeSeconds: 31536000
            }
        }
    },
    {
        urlPattern: /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "google-fonts-stylesheets",
            expiration: {
                maxEntries: 4,
                maxAgeSeconds: 604800
            }
        }
    },
    {
        urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "static-font-assets",
            expiration: {
                maxEntries: 4,
                maxAgeSeconds: 604800
            }
        }
    },
    {
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "static-image-assets",
            expiration: {
                maxEntries: 64,
                maxAgeSeconds: 2592000
            }
        }
    },
    {
        urlPattern: /\/_next\/static.+\.js$/i,
        handler: "CacheFirst",
        options: {
            cacheName: "next-static-js-assets",
            expiration: {
                maxEntries: 64,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\/_next\/image\?url=.+$/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "next-image",
            expiration: {
                maxEntries: 64,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\.(?:mp3|wav|ogg)$/i,
        handler: "CacheFirst",
        options: {
            rangeRequests: !0,
            cacheName: "static-audio-assets",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\.(?:mp4|webm)$/i,
        handler: "CacheFirst",
        options: {
            rangeRequests: !0,
            cacheName: "static-video-assets",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\.(?:js)$/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "static-js-assets",
            expiration: {
                maxEntries: 48,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\.(?:css|less)$/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "static-style-assets",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\/_next\/data\/.+\/.+\.json$/i,
        handler: "StaleWhileRevalidate",
        options: {
            cacheName: "next-data",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: /\.(?:json|xml|csv)$/i,
        handler: "NetworkFirst",
        options: {
            cacheName: "static-data-assets",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: ({ sameOrigin: e, url: { pathname: t } })=>!(!e || t.startsWith("/api/auth/callback")) && !!t.startsWith("/api/"),
        handler: "NetworkFirst",
        method: "GET",
        options: {
            cacheName: "apis",
            expiration: {
                maxEntries: 16,
                maxAgeSeconds: 86400
            },
            networkTimeoutSeconds: 10
        }
    },
    {
        urlPattern: ({ request: e, url: { pathname: t }, sameOrigin: a })=>"1" === e.headers.get("RSC") && "1" === e.headers.get("Next-Router-Prefetch") && a && !t.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
            cacheName: "pages-rsc-prefetch",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: ({ request: e, url: { pathname: t }, sameOrigin: a })=>"1" === e.headers.get("RSC") && a && !t.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
            cacheName: "pages-rsc",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: ({ url: { pathname: e }, sameOrigin: t })=>t && !e.startsWith("/api/"),
        handler: "NetworkFirst",
        options: {
            cacheName: "pages",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 86400
            }
        }
    },
    {
        urlPattern: ({ sameOrigin: e })=>!e,
        handler: "NetworkFirst",
        options: {
            cacheName: "cross-origin",
            expiration: {
                maxEntries: 32,
                maxAgeSeconds: 3600
            },
            networkTimeoutSeconds: 10
        }
    }
];const overrideAfterCalledMethod = (e)=>{
    Object.defineProperty(e, "alreadyCalled", {
        get: ()=>!1,
        set () {}
    });
};
const isInjectManifestConfig = (e)=>void 0 !== e && "string" == typeof e.swSrc;
const getFileHash = (r)=>e$5.createHash("md5").update(e$3.readFileSync(r)).digest("hex");
const getContentHash = (e, t)=>t ? "development" : getFileHash(e).slice(0, 16);const getDefaultDocumentPage = (f, t)=>{
    let n = findFirstTruthy([
        "pages",
        "src/pages"
    ], (o)=>(o = e$2.join(f, o), e$3.existsSync(o) ? o : void 0)), s = findFirstTruthy([
        "app",
        "src/app"
    ], (o)=>(o = e$2.join(f, o), e$3.existsSync(o) ? o : void 0));
    if (n || s) for (let o of t){
        if (s) {
            let f = e$2.join(s, `~offline/page.${o}`);
            if (e$3.existsSync(f)) return "/~offline";
        }
        if (n) {
            let f = e$2.join(n, `_offline.${o}`);
            if (f && e$3.existsSync(f)) return "/_offline";
        }
    }
};let l = fileURLToPath(new URL(".", import.meta.url));
const createContext = (t, p, m, u, c)=>{
    "function" == typeof m.webpack && (u = m.webpack(u, p));
    let _ = {
        ...p.config,
        basePath: p.config.basePath || "/"
    }, { disable: d = !1, register: f = !0, dest: b = "public", sw: g = "sw.js", cacheStartUrl: h = !0, dynamicStartUrl: w = !0, dynamicStartUrlRedirect: j, publicExcludes: x = [
        "!noprecache/**/*"
    ], fallbacks: P = {}, cacheOnFrontEndNav: A = !1, aggressiveFrontEndNavCaching: k = !1, reloadOnOnline: y = !0, scope: v = _.basePath, customWorkerSrc: E = "worker", customWorkerDest: W = b, customWorkerPrefix: $ = "worker", workboxOptions: { additionalManifestEntries: N, manifestTransforms: O = [], exclude: C = [
        /\/_next\/static\/.*(?<!\.p)\.woff2/,
        /\.map$/,
        /^manifest.*\.js$/
    ], ...R } = {}, extendDefaultRuntimeCaching: D = !1 } = c;
    if (d) return p.isServer || info("PWA support is disabled."), {
        disabled: !0,
        webpackConfig: u
    };
    let I = u.output?.publicPath;
    u.plugins || (u.plugins = []);
    let S = e$2.resolve(p.dir, "public");
    N || (N = r$5.sync([
        "**/*",
        "!{workbox,fallback,swe-worker,worker}-*.js",
        "!{workbox,fallback,swe-worker,worker}-*.js.map",
        `!${g.replace(/^\/+/, "")}`,
        `!${g.replace(/^\/+/, "")}.map`,
        ...x
    ], {
        cwd: S
    }).map((t)=>({
            url: e$2.posix.join(_.basePath, t),
            revision: getFileHash(e$2.resolve(S, t))
        }))), h && (w ? "string" == typeof j && j.length > 0 && N.push({
        url: j,
        revision: p.buildId
    }) : N.push({
        url: _.basePath,
        revision: p.buildId
    }));
    let T = e$2.join(p.dir, b);
    e$2.isAbsolute(E) || (E = e$2.join(p.dir, E)), P && !P.document && (P.document = getDefaultDocumentPage(p.dir, _.pageExtensions));
    let L = {
        disable: d,
        register: f,
        dest: T,
        sw: e$2.posix.join(_.basePath, g),
        swPath: g,
        cacheStartUrl: h,
        dynamicStartUrl: w,
        dynamicStartUrlRedirect: j,
        publicExcludes: x,
        fallbacks: P,
        cacheOnFrontEndNav: A,
        aggressiveFrontEndNavCaching: k,
        reloadOnOnline: y,
        scope: e$2.posix.join(v, "/"),
        customWorkerSrc: E,
        customWorkerDest: e$2.resolve(p.dir, W),
        customWorkerPrefix: $,
        workboxOptions: {
            ...R,
            swDest: e$2.join(T, g),
            additionalManifestEntries: p.dev ? [] : N,
            exclude: [
                ...C,
                ({ asset: e })=>!!(e.name.startsWith("server/") || e.name.match(/^((app-|^)build-manifest\.json|react-loadable-manifest\.json)$/)) || !!p.dev && !e.name.startsWith("static/runtime/")
            ],
            manifestTransforms: [
                ...O,
                async (t, i)=>{
                    let s = relativeToOutputPath$1(i, S), a = `${I}${s}`;
                    return {
                        manifest: t.map((t)=>{
                            if (t.url = t.url.replace("/_next//static/image", "/_next/static/image").replace("/_next//static/media", "/_next/static/media"), t.url.startsWith(a) && (t.url = e$2.posix.join(_.basePath, t.url.replace(a, ""))), null === t.revision) {
                                let e = t.url;
                                "string" == typeof I && e.startsWith(I) && (e = t.url.substring(I.length));
                                let s = i.assetsInfo.get(e);
                                t.revision = s && s.contenthash || p.buildId;
                            }
                            return t.url = t.url.replace(/\[/g, "%5B").replace(/\]/g, "%5D"), t;
                        }),
                        warnings: []
                    };
                }
            ]
        },
        extendDefaultRuntimeCaching: D
    }, F = loadTSConfig(p.dir, _.typescript.tsconfigPath);
    u.plugins.push(new t.DefinePlugin({
        __PWA_SW__: `'${L.sw}'`,
        __PWA_SCOPE__: `'${L.scope}'`,
        __PWA_ENABLE_REGISTER__: `${!!L.register}`,
        __PWA_START_URL__: L.dynamicStartUrl ? `'${_.basePath}'` : void 0,
        __PWA_CACHE_ON_FRONT_END_NAV__: `${!!L.cacheOnFrontEndNav}`,
        __PWA_AGGRFEN_CACHE__: `${!!L.aggressiveFrontEndNavCaching}`,
        __PWA_RELOAD_ON_ONLINE__: `${!!L.reloadOnOnline}`
    }));
    let G = e$2.join(l, "sw-entry.js"), U = u.entry;
    return u.entry = async ()=>{
        let e = await U();
        return e["main.js"] && !e["main.js"].includes(G) && (Array.isArray(e["main.js"]) ? e["main.js"].unshift(G) : "string" == typeof e["main.js"] && (e["main.js"] = [
            G,
            e["main.js"]
        ])), e["main-app"] && !e["main-app"].includes(G) && (Array.isArray(e["main-app"]) ? e["main-app"].unshift(G) : "string" == typeof e["main-app"] && (e["main-app"] = [
            G,
            e["main-app"]
        ])), e;
    }, {
        disabled: !1,
        publicPath: I,
        nextConfig: _,
        webpack: t,
        webpackContext: p,
        webpackConfig: u,
        tsConfig: F,
        userOptions: c,
        options: L
    };
};const resolveRuntimeCaching = (o, n)=>{
    if (!o) return e;
    if (!n) return info("Custom runtimeCaching array found, using it instead of the default one."), o;
    info("Custom runtimeCaching array found, using it to extend the default one.");
    let i = [], a = new Set();
    for (let e of o)i.push(e), e.options?.cacheName && a.add(e.options.cacheName);
    for (let e$1 of e)e$1.options?.cacheName && a.has(e$1.options.cacheName) || i.push(e$1);
    return i;
};const relativeToOutputPath = (o, e)=>e$2.isAbsolute(e) ? e$2.relative(o.options.output.path, e) : e;class ChildCompilationPlugin {
    src;
    dest;
    plugins;
    webpack;
    constructor({ src: t, dest: i, plugins: s, webpack: e }){
        this.src = t, this.dest = i, this.plugins = s, this.webpack = e;
    }
    apply(t) {
        t.hooks.make.tapPromise(this.constructor.name, (i)=>this.performChildCompilation(i, t).catch((t)=>{
                i.errors.push(t);
            }));
    }
    async performChildCompilation(i, s) {
        let e = relativeToOutputPath(i, this.dest), r = i.createChildCompiler(this.constructor.name, {
            filename: e
        }, []);
        if (r.context = s.context, r.inputFileSystem = s.inputFileSystem, r.outputFileSystem = s.outputFileSystem, void 0 !== this.plugins) for (let t of this.plugins)t?.apply(r);
        new this.webpack.EntryPlugin(s.context, this.src, this.constructor.name).apply(r), await new Promise((t, s)=>{
            r.runAsChild((e, r, o)=>{
                e ? s(e) : (i.warnings = i.warnings.concat(o?.warnings ?? []), i.errors = i.errors.concat(o?.errors ?? []), t());
            });
        });
    }
}const buildCustomWorker = (s)=>{
    let i = r$5.sync("{src/,}index.{ts,js}", {
        cwd: s.options.customWorkerSrc
    });
    if (0 === i.length) return;
    let m = e$2.join(s.options.customWorkerSrc, i[0]);
    event(`Found a custom worker implementation at ${m}.`);
    let p = `${s.options.customWorkerPrefix}-${getContentHash(m, s.webpackContext.dev)}.js`;
    return event(`Building the custom worker to ${e$2.join(s.options.customWorkerDest, p)}...`), {
        name: e$2.posix.join(s.nextConfig.basePath, p),
        pluginInstance: new ChildCompilationPlugin({
            src: m,
            dest: e$2.join(s.options.customWorkerDest, p),
            webpack: s.webpack
        })
    };
};const getFallbackEnvs = ({ fallbacks: e, buildId: o })=>{
    let t = e.data;
    t?.endsWith(".json") && (t = e$2.posix.join("/_next/data", o, t));
    let n = 0, L = [
        [
            "DOCUMENT",
            e.document
        ],
        [
            "IMAGE",
            e.image
        ],
        [
            "AUDIO",
            e.audio
        ],
        [
            "VIDEO",
            e.video
        ],
        [
            "FONT",
            e.font
        ],
        [
            "DATA",
            t
        ]
    ].reduce((_, A)=>(A[1] && (n++, _[`__PWA_FALLBACK_${A[0]}__`] = A[1]), _), {});
    if (0 !== n) return info("This app will fallback to these precached routes when fetching from the cache and the network fails:"), L.__PWA_FALLBACK_DOCUMENT__ && info(`  Documents (pages): ${L.__PWA_FALLBACK_DOCUMENT__}`), L.__PWA_FALLBACK_IMAGE__ && info(`  Images: ${L.__PWA_FALLBACK_IMAGE__}`), L.__PWA_FALLBACK_AUDIO__ && info(`  Audio: ${L.__PWA_FALLBACK_AUDIO__}`), L.__PWA_FALLBACK_VIDEO__ && info(`  Videos: ${L.__PWA_FALLBACK_VIDEO__}`), L.__PWA_FALLBACK_FONT__ && info(`  Fonts: ${L.__PWA_FALLBACK_FONT__}`), L.__PWA_FALLBACK_DATA__ && info(`  Data (/_next/data/**/*.json): ${L.__PWA_FALLBACK_DATA__}`), L;
};let i = fileURLToPath(new URL(".", import.meta.url));
const buildFallbackWorker = (t)=>{
    let a = getFallbackEnvs({
        fallbacks: Object.keys(t.options.fallbacks).reduce((n, o)=>{
            let l = t.options.fallbacks[o];
            return l && (n[o] = e$2.posix.join(t.nextConfig.basePath, l)), n;
        }, {}),
        buildId: t.webpackContext.buildId
    });
    if (!a) return;
    let s = e$2.join(i, "fallback.js"), r = `fallback-${getContentHash(s, t.webpackContext.dev)}.js`;
    return {
        name: e$2.posix.join(t.nextConfig.basePath, r),
        precaches: Object.values(a).filter((e)=>!!e),
        pluginInstance: new ChildCompilationPlugin({
            src: s,
            dest: e$2.join(t.options.dest, r),
            plugins: [
                new t.webpack.EnvironmentPlugin(a)
            ],
            webpack: t.webpack
        })
    };
};const buildWorkers = (i)=>{
    let s = [], n = buildCustomWorker(i);
    i.options.workboxOptions.importScripts || (i.options.workboxOptions.importScripts = []), void 0 !== n && (i.options.workboxOptions.importScripts.unshift(n.name), s.push(n.pluginInstance));
    let r = !1;
    if (i.options.fallbacks) {
        let o = buildFallbackWorker(i);
        if (o) for (let t of (r = !0, i.options.workboxOptions.importScripts.unshift(o.name), s.push(o.pluginInstance), i.options.workboxOptions.additionalManifestEntries || (i.options.workboxOptions.additionalManifestEntries = []), o.precaches))t && "boolean" != typeof t && !i.options.workboxOptions.additionalManifestEntries.find((o)=>"object" == typeof o && o.url.startsWith(t)) && i.options.workboxOptions.additionalManifestEntries.push({
            url: t,
            revision: i.webpackContext.buildId
        });
    }
    return {
        hasFallbacks: r,
        childCompilationInstances: s
    };
};const resolveWorkboxPlugin = (a)=>{
    let p;
    if (isInjectManifestConfig(a.options.workboxOptions)) {
        let n = e$2.join(a.webpackContext.dir, a.options.workboxOptions.swSrc);
        event(`Using InjectManifest with ${n}`);
        let i = new o$2.InjectManifest({
            ...a.options.workboxOptions,
            swSrc: n
        });
        return a.webpackContext.dev && overrideAfterCalledMethod(i), [
            i
        ];
    }
    let { hasFallbacks: l, childCompilationInstances: c } = buildWorkers(a), { skipWaiting: d = !0, clientsClaim: u = !0, cleanupOutdatedCaches: h = !0, ignoreURLParametersMatching: f = [
        /^utm_/,
        /^fbclid$/
    ], importScripts: m, runtimeCaching: b, ...w } = a.options.workboxOptions, k = !1;
    a.webpackContext.dev ? (info("Building in development mode, caching and precaching are disabled for the most part. This means that offline support is disabled, but you can continue developing other functions in service worker."), f.push(/ts/), p = [
        {
            urlPattern: /.*/i,
            handler: "NetworkOnly",
            options: {
                cacheName: "dev"
            }
        }
    ], k = !0) : p = resolveRuntimeCaching(b, a.options.extendDefaultRuntimeCaching), a.options.dynamicStartUrl && p.unshift({
        urlPattern: a.nextConfig.basePath,
        handler: "NetworkFirst",
        options: {
            cacheName: "start-url",
            plugins: [
                {
                    cacheWillUpdate: async ({ response: e })=>e && "opaqueredirect" === e.type ? new Response(e.body, {
                            status: 200,
                            statusText: "OK",
                            headers: e.headers
                        }) : e
                }
            ]
        }
    }), l && p.forEach((e)=>{
        !e.options || e.options.precacheFallback || e.options.plugins?.find((e)=>"handlerDidError" in e) || (e.options.plugins || (e.options.plugins = []), e.options.plugins.push({
            handlerDidError: async ({ request: e })=>"undefined" != typeof self ? self.fallback(e) : Response.error()
        }));
    });
    let g = new o$2.GenerateSW({
        ...w,
        skipWaiting: d,
        clientsClaim: u,
        cleanupOutdatedCaches: h,
        ignoreURLParametersMatching: f,
        importScripts: m,
        runtimeCaching: p
    });
    return k && overrideAfterCalledMethod(g), [
        g,
        ...c
    ];
};let r = fileURLToPath(new URL(".", import.meta.url));
const buildSWEntryWorker = (e)=>{
    if (!e.options.cacheOnFrontEndNav) return;
    let i = e$2.join(r, "sw-entry-worker.js"), s = `swe-worker-${getContentHash(i, e.webpackContext.dev)}.js`;
    return {
        name: e$2.posix.join(e.nextConfig.basePath, s),
        pluginInstance: new ChildCompilationPlugin({
            src: i,
            dest: e$2.join(e.options.dest, s),
            webpack: e.webpack
        })
    };
};var index = ((s = {})=>(a = {})=>({
            ...a,
            webpack (c, f) {
                let w = createContext(f.webpack, f, a, c, s);
                if (w.disabled) return w.webpackConfig;
                if (w.webpackConfig.plugins || (w.webpackConfig.plugins = []), event(`Compiling for ${f.isServer ? "server" : "client (static)"}...`), !f.isServer) {
                    for (let e of [
                        ...r$5.sync([
                            "{workbox,fallback,swe-worker,worker}-*.js",
                            "{workbox,fallback,swe-worker,worker}-*.js.map",
                            `${w.options.swPath.replace(/^\/+/, "")}`,
                            `${w.options.swPath.replace(/^\/+/, "")}.map`
                        ], {
                            absolute: !0,
                            cwd: w.options.dest
                        }),
                        ...r$5.sync([
                            `${w.options.customWorkerPrefix}-*.js`,
                            `${w.options.customWorkerPrefix}-*.js.map`
                        ], {
                            absolute: !0,
                            cwd: w.options.customWorkerDest
                        })
                    ])e$3.rmSync(e, {
                        force: !0
                    });
                    let s = buildSWEntryWorker(w);
                    w.webpackConfig.plugins.push(new w.webpack.DefinePlugin({
                        __PWA_SW_ENTRY_WORKER__: s?.name && `'${s.name}'`
                    }), ...s ? [
                        s.pluginInstance
                    ] : []), w.options.register || (info("Service worker won't be automatically registered as per the config, please call the following code in componentDidMount or useEffect:"), info("  window.workbox.register()"), w.tsConfig?.compilerOptions?.types?.includes("@ducanh2912/next-pwa/workbox") || info("You may also want to add @ducanh2912/next-pwa/workbox to compilerOptions.types in your tsconfig.json/jsconfig.json.")), info(`Service worker: ${e$2.join(w.options.dest, w.options.sw)}`), info(`  URL: ${w.options.sw}`), info(`  Scope: ${w.options.scope}`), w.webpackConfig.plugins.push(...resolveWorkboxPlugin(w));
                }
                return w.webpackConfig;
            }
        }));export{index as default,e as runtimeCaching};