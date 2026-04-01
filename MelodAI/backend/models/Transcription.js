const mongoose = require('mongoose');

const transcriptionSchema = new mongoose.Schema({
    filename: { type: String, required: true, unique: true }, // Nombre único generado por multer
    originalName: { type: String, required: true }, // Nombre real del archivo (ej. test.mp3)
    status: { type: String, default: 'Subiendo...' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transcription', transcriptionSchema);