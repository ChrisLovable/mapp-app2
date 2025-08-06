/**
 * Converts a WebM audio file to MP3 format using FFmpeg
 * @param inputPath - Path to the input WebM file
 * @param outputPath - Path where the MP3 file will be saved
 * @returns Promise that resolves when conversion is complete
 */
export declare function convertWebmToMp3(inputPath: string, outputPath: string): Promise<void>;
/**
 * Converts multiple WebM files to MP3 format
 * @param files - Array of file paths to convert
 * @param outputDir - Directory where MP3 files will be saved
 * @returns Promise that resolves when all conversions are complete
 */
export declare function convertMultipleWebmToMp3(files: string[], outputDir: string): Promise<void>;
/**
 * Converts a WebM file to MP3 with custom options
 * @param inputPath - Path to the input WebM file
 * @param outputPath - Path where the MP3 file will be saved
 * @param options - Custom conversion options
 * @returns Promise that resolves when conversion is complete
 */
export declare function convertWebmToMp3WithOptions(inputPath: string, outputPath: string, options?: {
    bitrate?: number;
    channels?: number;
    sampleRate?: number;
    quality?: number;
}): Promise<void>;
/**
 * Gets information about an audio file
 * @param filePath - Path to the audio file
 * @returns Promise that resolves with file information
 */
export declare function getAudioInfo(filePath: string): Promise<any>;
/**
 * Example usage function
 */
export declare function exampleUsage(): Promise<void>;
declare const _default: {
    convertWebmToMp3: typeof convertWebmToMp3;
    convertMultipleWebmToMp3: typeof convertMultipleWebmToMp3;
    convertWebmToMp3WithOptions: typeof convertWebmToMp3WithOptions;
    getAudioInfo: typeof getAudioInfo;
};
export default _default;
