# GrammarBuddy Chrome Extension

A powerful Chrome extension that provides smart text suggestions and improvements using AI. Similar to Wordtune, this extension helps you write better by offering various text enhancement options.

## Features

- 🔄 Real-time text suggestions
- 🎯 Multiple suggestion modes:
  - Improve text
  - Make formal
  - Make casual
  - Shorten text
  - Expand text
  - Fix grammar
  - Translate to Bangla
- 🔑 API key configuration
- 📋 Easy copy suggestions
- ⌨️ Keyboard shortcuts
- 🎨 Modern and intuitive UI

## Installation

### From Chrome Web Store
1. Visit the Chrome Web Store (link to be added)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation
1. Download the latest release from the [Releases page](https://github.com/yourusername/grammar-buddy/releases)
2. Extract the ZIP file
3. Open Chrome and go to `chrome://extensions/`
4. Enable "Developer mode" in the top right
5. Click "Load unpacked" and select the extracted folder

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter your API key and click "Connect API"
3. Enable the extension using the toggle switch
4. Type or paste text in the test area
5. Click "Get Suggestions" to see AI-powered suggestions
6. Use the mode selector to choose different types of suggestions
7. Click the copy button next to any suggestion to copy it

## Keyboard Shortcuts

- `1-9`: Select suggestion
- `Esc`: Close suggestions
- `Ctrl/Cmd + C`: Copy selected suggestion

## Development

### Prerequisites
- Node.js (v22.15.0 or higher)
  - We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions
  - The project includes an `.nvmrc` file for automatic version switching
  - To use the correct version:
    ```bash
    nvm install
    nvm use
    ```
- npm (v10.2.4 or higher) or yarn (v1.22.19 or higher)

### Setup
1. Clone the repository:
```bash
git clone https://github.com/yourusername/grammar-buddy.git
cd grammar-buddy
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

### Development Commands
- `npm run build`: Build the extension
- `npm run watch`: Watch for changes and rebuild
- `npm run format`: Format code using Prettier
- `npm run lint`: Lint code using ESLint
- `npm run test`: Run tests

### Creating a Release
To create a new release:

1. Make sure all changes are committed:
```bash
git add .
git commit -m "Your commit message"
```

2. Create a new tag (replace X.Y.Z with your version number):
```bash
git tag -a vX.Y.Z -m "Release version X.Y.Z"
```

3. Push the tag to GitHub:
```bash
git push origin vX.Y.Z
```

For example, to create and push version 1.0.0:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

The GitHub Actions workflow will automatically:
- Build the extension
- Create a new release
- Upload the built files
- Create a release artifact

You can verify the release by:
1. Going to your GitHub repository
2. Clicking on "Releases" in the right sidebar
3. Checking your new release with the built files

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Wordtune
- Built with Chrome Extension Manifest V3
- Uses modern web technologies 