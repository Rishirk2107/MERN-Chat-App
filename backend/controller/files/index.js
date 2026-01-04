const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Message, User } = require('../../model/dbmodel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

module.exports = function initFiles(app, io) {
  app.post('/file/upload', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { room, user } = req.body;
      if (!file || !room) return res.status(400).json({ Message: false, error: 'Missing file or room' });

      let resourceType = 'raw';
      if (file.mimetype.startsWith('image/')) resourceType = 'image';
      else if (file.mimetype.startsWith('video/')) resourceType = 'video';

      const b64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(b64, { resource_type: resourceType, folder: 'chat_files' });

      // resolve display name
      let displayName = typeof user === 'string' ? user : (user && user.name) || (user && user.username) || String(user || '');
      try {
        const userId = Number(user);
        if (!Number.isNaN(userId)){
          const userDoc = await User.findOne({ userid: userId }, { name: 1, username: 1 });
          if (userDoc) displayName = userDoc.username || userDoc.name || displayName;
        }
      } catch (e) { /* ignore */ }

      const mes = new Message({
        userId: Number(user) || null,
        user: displayName,
        room: room,
        type: 'file',
        file: {
          publicId: uploadResult.public_id,
          url: uploadResult.secure_url,
          originalName: file.originalname,
          format: uploadResult.format,
          resourceType: uploadResult.resource_type,
          bytes: uploadResult.bytes
        }
      });

      const saved = await mes.save();

      io.to(room).emit('message', { type: 'file', file: mes.file }, displayName);

      return res.json({ Message: true, data: saved });
    } catch (error) {
      console.error('File upload error', error);
      return res.status(500).json({ Message: false, error: 'Server error' });
    }
  });
};
