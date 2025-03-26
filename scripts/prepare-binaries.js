const fs = require('fs-extra');
const path = require('path');
const https = require('https');
const os = require('os');

// Create directories for each platform
const platforms = {
  win32: 'windows',
  darwin: 'mac',
  linux: 'linux'
};

const resourcesDir = path.join(__dirname, '..', 'resources');
const binDir = path.join(resourcesDir, 'bin');

// Ensure the resources/bin directory exists
fs.ensureDirSync(binDir);

// Create platform-specific directories
Object.values(platforms).forEach(platform => {
  fs.ensureDirSync(path.join(binDir, platform));
});

// Download function
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} to ${destination}`);
    
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download, status code: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Download the binaries for each platform
async function downloadBinaries() {
  const downloads = [
    // Windows
    {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
      destination: path.join(binDir, platforms.win32, 'yt-dlp.exe')
    },
    // macOS
    {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos',
      destination: path.join(binDir, platforms.darwin, 'yt-dlp')
    },
    // Linux
    {
      url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
      destination: path.join(binDir, platforms.linux, 'yt-dlp')
    }
  ];
  
  for (const download of downloads) {
    try {
      await downloadFile(download.url, download.destination);
      
      // Set executable permissions on Unix binaries
      if (!download.destination.endsWith('.exe')) {
        fs.chmodSync(download.destination, 0o755);
      }
    } catch (error) {
      console.error(`Failed to download ${download.url}:`, error);
    }
  }
}

// Run the download
downloadBinaries().then(() => {
  console.log('All binaries downloaded successfully!');
}).catch((error) => {
  console.error('Error downloading binaries:', error);
  process.exit(1);
}); 