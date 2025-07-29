# Audio Instructions System

## Overview
The hamburger menu now includes an "Instructions" option with audio files to explain each of the 12 main app buttons.

## Menu Structure
- **User Preferences** - User settings and preferences
- **Dashboard** - Main dashboard view
- **Personalization** - Theme and appearance customization
- **Instructions** - Audio explanations for each app feature

## Instructions Submenu
The Instructions submenu contains audio explanations for:

1. **Diary** - `diary-instruction.mp3`
2. **ASK AI** - `ask-ai-instruction.mp3`
3. **Calendar** - `calendar-instruction.mp3`
4. **Translate** - `translate-instruction.mp3`
5. **Rewrite** - `rewrite-instruction.mp3`
6. **Read PDF** - `read-pdf-instruction.mp3`
7. **Image to Text** - `image-to-text-instruction.mp3`
8. **To-Do** - `todo-instruction.mp3`
9. **Expenses** - `expenses-instruction.mp3`
10. **Smart Recorder** - `smart-recorder-instruction.mp3`
11. **BUY** - `buy-instruction.mp3`
12. **Create AI Image** - `text2imagefunction.mp3`

## Audio Files Location
All audio files should be placed in: `/public/audio/`

## File Naming Convention
- All audio files should be in MP3 format
- Use the exact filenames listed above
- Keep file sizes reasonable for web loading

## How It Works
1. User clicks the hamburger menu (☰)
2. User selects "Instructions"
3. Submenu expands showing all 12 app features
4. User clicks on any feature to hear audio explanation
5. Audio plays automatically in the browser

## Error Handling
- If audio file is missing, user gets an alert message
- Console logs provide debugging information
- Graceful fallback for unsupported audio formats

## Adding New Audio Files
1. Create your MP3 audio file
2. Name it according to the convention above
3. Place it in `/public/audio/` directory
4. Test by clicking the corresponding instruction in the menu

## Audio Content Suggestions
Each audio file should contain:
- Brief explanation of what the feature does
- How to use the feature
- Any important tips or limitations
- Keep duration under 30 seconds for better user experience

## Technical Notes
- Uses HTML5 Audio API
- Supports MP3 format (widely compatible)
- Includes error handling and user feedback
- Responsive design for mobile devices 