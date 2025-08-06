import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
/**
 * Converts a WebM audio file to MP3 format using FFmpeg
 * @param inputPath - Path to the input WebM file
 * @param outputPath - Path where the MP3 file will be saved
 * @returns Promise that resolves when conversion is complete
 */
export function convertWebmToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // Check if input file exists
        if (!fs.existsSync(inputPath)) {
            reject(new Error(`Input file not found: ${inputPath}`));
            return;
        }
        // Check if output directory exists, create if not
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        console.log(`Starting conversion: ${inputPath} -> ${outputPath}`);
        ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate(192) // Set bitrate to 192kbps for good quality
            .audioChannels(1) // Mono audio for smaller file size
            .audioFrequency(44100) // Standard sample rate
            .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
        })
            .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
        })
            .on('end', () => {
            console.log('Conversion finished successfully!');
            resolve();
        })
            .on('error', (err) => {
            console.error('Error during conversion:', err);
            reject(err);
        })
            .save(outputPath);
    });
}
/**
 * Converts multiple WebM files to MP3 format
 * @param files - Array of file paths to convert
 * @param outputDir - Directory where MP3 files will be saved
 * @returns Promise that resolves when all conversions are complete
 */
export async function convertMultipleWebmToMp3(files, outputDir) {
    const conversions = files.map(async (inputPath) => {
        const filename = path.basename(inputPath, '.webm');
        const outputPath = path.join(outputDir, `${filename}.mp3`);
        return convertWebmToMp3(inputPath, outputPath);
    });
    await Promise.all(conversions);
    console.log(`Converted ${files.length} files to MP3`);
}
/**
 * Converts a WebM file to MP3 with custom options
 * @param inputPath - Path to the input WebM file
 * @param outputPath - Path where the MP3 file will be saved
 * @param options - Custom conversion options
 * @returns Promise that resolves when conversion is complete
 */
export function convertWebmToMp3WithOptions(inputPath, outputPath, options = {}) {
    return new Promise((resolve, reject) => {
        const { bitrate = 192, channels = 1, sampleRate = 44100, quality = 0 } = options;
        if (!fs.existsSync(inputPath)) {
            reject(new Error(`Input file not found: ${inputPath}`));
            return;
        }
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        console.log(`Starting conversion with custom options: ${inputPath} -> ${outputPath}`);
        let command = ffmpeg(inputPath)
            .toFormat('mp3')
            .audioBitrate(bitrate)
            .audioChannels(channels)
            .audioFrequency(sampleRate);
        if (quality > 0) {
            command = command.audioQuality(quality);
        }
        command
            .on('start', (commandLine) => {
            console.log('FFmpeg command:', commandLine);
        })
            .on('progress', (progress) => {
            console.log(`Processing: ${progress.percent}% done`);
        })
            .on('end', () => {
            console.log('Conversion finished successfully!');
            resolve();
        })
            .on('error', (err) => {
            console.error('Error during conversion:', err);
            reject(err);
        })
            .save(outputPath);
    });
}
/**
 * Gets information about an audio file
 * @param filePath - Path to the audio file
 * @returns Promise that resolves with file information
 */
export function getAudioInfo(filePath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            reject(new Error(`File not found: ${filePath}`));
            return;
        }
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(metadata);
        });
    });
}
/**
 * Example usage function
 */
export async function exampleUsage() {
    try {
        const inputFile = path.join(__dirname, '../downloads/meeting-2024-01-15.webm');
        const outputFile = path.join(__dirname, '../downloads/meeting-2024-01-15.mp3');
        // Basic conversion
        await convertWebmToMp3(inputFile, outputFile);
        console.log('Basic conversion completed!');
        // Conversion with custom options
        await convertWebmToMp3WithOptions(inputFile, outputFile, {
            bitrate: 320,
            channels: 2,
            sampleRate: 48000,
            quality: 0
        });
        console.log('Custom conversion completed!');
        // Get file information
        const info = await getAudioInfo(inputFile);
        console.log('File info:', info);
    }
    catch (error) {
        console.error('Example failed:', error);
    }
}
// Export for use in other modules
export default {
    convertWebmToMp3,
    convertMultipleWebmToMp3,
    convertWebmToMp3WithOptions,
    getAudioInfo
};
