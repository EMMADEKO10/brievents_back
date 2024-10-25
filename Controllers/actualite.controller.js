const Actualite = require('../Models/actualite.model');
const { cloudinary, getUploadFolder } = require('../cloudinary');
const { compressImage, deleteFileWithDelay } = require('../utils/imageUtils');
const sharp = require('sharp');

exports.createActualite = async (req, res) => {
  const { title, content, author } = req.body;

  if (!title || !content || !author || !req.file) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  let compressedFile, tempFile;

  try {
    const { newPath, tempPath } = await compressImage(req.file);
    compressedFile = newPath;
    tempFile = tempPath;

    const uploadFolder = getUploadFolder();

    const uploadedImage = await cloudinary.uploader.upload(compressedFile, {
      folder: uploadFolder,
    });

    const newActualite = new Actualite({
      title,
      content,
      author,
      imageUrl: uploadedImage.secure_url,
    });

    const savedActualite = await newActualite.save();

    try {
      await deleteFileWithDelay(tempFile);
      await deleteFileWithDelay(compressedFile);
    } catch (unlinkError) {
      console.warn(`Couldn't delete temporary files`, unlinkError);
    }

    return res.status(201).json(savedActualite);
  } catch (error) {
    console.error('Error creating actualite:', error);
    if (compressedFile) {
      await fs.unlink(compressedFile).catch(console.error);
    }
    if (tempFile) {
      await fs.unlink(tempFile).catch(console.error);
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getAllActualites = async (req, res) => {
  try {
    const actualites = await Actualite.find().sort({ date: -1 });
    res.status(200).json(actualites);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching actualites' });
  }
};

exports.getActualiteById = async (req, res) => {
    try {
      const actualite = await Actualite.findById(req.params.id);
      if (!actualite) {
        return res.status(404).json({ error: 'Actualite not found' });
      }
      
      // Fetch related articles
      const relatedActualites = await Actualite.find({
        _id: { $ne: actualite._id },  // Exclude the current article
      })
      .sort({ date: -1 })  // Sort by date, newest first
      .limit(3);  // Limit to 3 related articles
  
      res.status(200).json({ actualite, relatedActualites });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching actualite and related articles' });
    }
  };
  

exports.updateActualite = async (req, res) => {
  const { title, content, author } = req.body;

  try {
    let updateData = { title, content, author };

    if (req.file) {
      const { newPath, tempPath } = await compressImage(req.file);
      const uploadFolder = getUploadFolder();
      const uploadedImage = await cloudinary.uploader.upload(newPath, {
        folder: uploadFolder,
      });
      updateData.imageUrl = uploadedImage.secure_url;

      await deleteFileWithDelay(tempPath);
      await deleteFileWithDelay(newPath);
    }

    const updatedActualite = await Actualite.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedActualite) {
      return res.status(404).json({ error: 'Actualite not found' });
    }

    res.status(200).json(updatedActualite);
  } catch (error) {
    res.status(500).json({ error: 'Error updating actualite' });
  }
};

exports.deleteActualite = async (req, res) => {
  try {
    const deletedActualite = await Actualite.findByIdAndDelete(req.params.id);
    if (!deletedActualite) {
      return res.status(404).json({ error: 'Actualite not found' });
    }
    res.status(200).json({ message: 'Actualite deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting actualite' });
  }
};