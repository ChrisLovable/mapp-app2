export interface ExcelFile {
    name: string;
    size: number;
    totalSheets: number;
    data: any[][];
    sheets: string[];
}
export interface ChunkingResult {
    totalChunks: number;
    chunks: Chunk[];
    processingTime?: number;
}
export interface Chunk {
    sheetName: string;
    rowStart: number;
    rowEnd: number;
    totalRows: number;
    columns: string[];
    rawData: any[][];
    metadata: {
        semanticSummary: string;
    };
}
