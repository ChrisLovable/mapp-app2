#!/usr/bin/env node

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

/**
 * Converts a WebM audio file to MP3 format using FFmpeg
 */
function convertWebmToMp3(inputPath: string, outputPath: string): Promise<void> {
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
 * Main function to handle command line arguments
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: npm run convert-webm <input-file> [output-file]');
    console.log('Example: npm run convert-webm meeting-2024-01-15.webm');
    console.log('Example: npm run convert-webm meeting-2024-01-15.webm meeting-2024-01-15.mp3');
    process.exit(1);
  }

  const inputFile = args[0];
  let outputFile = args[1];

  // If no output file specified, create one with .mp3 extension
  if (!outputFile) {
    const inputPath = path.parse(inputFile);
    outputFile = path.join(inputPath.dir, `${inputPath.name}.mp3`);
  }

  try {
    console.log('WebM to MP3 Converter');
    console.log('=====================');
    console.log(`Input: ${inputFile}`);
    console.log(`Output: ${outputFile}`);
    console.log('');

    await convertWebmToMp3(inputFile, outputFile);
    
    console.log('');
    console.log('✅ Conversion completed successfully!');
    console.log(`📁 Output file: ${outputFile}`);
    
    // Show file size comparison
    const inputStats = fs.statSync(inputFile);
    const outputStats = fs.statSync(outputFile);
    
    console.log('');
    console.log('📊 File Size Comparison:');
    console.log(`   Input (WebM): ${(inputStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Output (MP3): ${(outputStats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Compression: ${((1 - outputStats.size / inputStats.size) * 100).toFixed(1)}% smaller`);
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { convertWebmToMp3 }; 