export function validatePublicPaths(paths: string[]): void;
export function assertPublicText(path: string, text: string): void;
export function assertArchiveMetadataFree(bytes: Uint8Array): void;
export function verifyReleaseFiles(dir: string, version: string): {version: string;assets: {path:string;bytes:number;sha256:string}[];publicFileCount:number};
export function collectPublicSourcePaths(root: string): string[];
