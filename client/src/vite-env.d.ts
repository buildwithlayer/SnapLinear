/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ViteTypeOptions {
    // By adding this line, you can make the type of ImportMetaEnv strict
    // to disallow unknown keys.
    strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_CALLBACK_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
