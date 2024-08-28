#!/usr/bin/env node

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const localtunnel = require('localtunnel');
const https = require('https');

const STORAGE_DIR = process.env.DIR || 'storage';
const storageDirPath = path.isAbsolute(STORAGE_DIR) ? STORAGE_DIR : path.join(__dirname, STORAGE_DIR);

if (!fs.existsSync(storageDirPath)) {
  // Error if storage dir path does not exist
  // fs.mkdirSync(storageDirPath, { recursive: true });
  console.errror('Storage directory not found')
  process.exit(1);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Storage directory
    cb(null, storageDirPath);
  },
  filename: function(req, file, cb) {
    const filePath = path.join(storageDirPath, file.originalname);
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return cb(new Error('File already exists'));
    }
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage
});

// Express application
const app = express();

// html page to make upload or download easier
app.get('/', (req, res) => {
  fs.readdir(storageDirPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to read storage path');
    }

    const fileList = files
      .filter(file => file !== '.gitignore' && file !== '.npmignore')
      .map(file => `<li><a href="/download?filename=${encodeURIComponent(file)}">${file}</a></li>`)
      .join('');

    res.send(`
      <h2>Upload a file</h2>
      <form action="/upload" method="POST" enctype="multipart/form-data">
        <input type="file" name="file" />
        <button type="submit">⬆️ Upload</button>
      </form>
      <h2>Download a file</h2>
      <form action="/download" method="GET">
        <input type="text" name="filename" placeholder="Filename" />
        <button type="submit">⬇️ Download</button>
      </form>
      <ul>${fileList}</ul>
    `);
  });
});

// Upload file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('File not found');
  }
  res.send(`"${req.file.originalname}" file uploaded`);
});

// Download file
app.get('/download', (req, res) => {
  const filename = req.query.filename;
  const filePath = path.join(storageDirPath, filename);

  // Check if file exists
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Disposition", 'attachment; filename="${filename}"');
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error: ', err);
        res.status(500).send('Error while downloading');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

// Start server
const PORT = process.env.PORT || 3000;
const HOSTNAME = process.env.HOSTNAME || 'localhost';
const server = app.listen(PORT, HOSTNAME, () => {
  console.log('Configuration:');
  console.log(`- HOSTNAME: ${HOSTNAME}`);
  console.log(`- PORT    : ${PORT}`);
  console.log(`- DIR     : ${storageDirPath}`);
  console.log(`Server started : http://${HOSTNAME}:${PORT}`);

  const LT_ENABLED = process.env.LT_ENABLED || false;
  if (LT_ENABLED) {
    localtunnel({
      port: PORT
    }, (err, tunnel) => {
      if (err) {
        console.error('Error starting localtunnel:', err);
        process.exit(2);
      }
      console.log(`Tunnel started : ${tunnel.url}`);

      https.get('https://loca.lt/mytunnelpassword', res =>
        res.on('data', d => console.log(`Tunnel password: ${d}`)));

      // Cleanup
      const cleanup = () => {
        console.log('Closing tunnel...');
        tunnel.close();
        console.log('Closing server...');
        server.close(() => {
          console.log('Server and tunnel closed');
          process.exit(0);
        });
      };
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
    });
  } else {
    console.log(`Tunnel not started`);
  }
});