require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const Transcription = require('./models/Transcription');

const app = express();
app.use(cors());
app.use(express.json());

const stemsPath = path.join(__dirname, '../ai-service/output_stems/htdemucs');
app.use('/stems', express.static(stemsPath));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => console.error('Error conectando a MongoDB:', err));

const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('audio'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo.' });

    const uniqueFilename = req.file.filename;
    const originalName = req.file.originalname;
    // Creamos la ruta absoluta (C:\Proyectos\...)
    const absolutePath = path.resolve(req.file.path);

    try {
        await Transcription.create({
            filename: uniqueFilename,
            originalName: originalName,
            status: 'Procesando pistas...'
        });

        // Enviamos la ruta absoluta a Python
        await fetch('http://127.0.0.1:8000/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                file_path: absolutePath,
                filename: uniqueFilename
            })
        });

        res.json({ message: 'Archivo en proceso', filename: uniqueFilename });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al comunicar con la IA' });
    }
});

app.post('/api/webhook', async (req, res) => {
    const { filename, status } = req.body;
    if (filename) {
        await Transcription.findOneAndUpdate({ filename: filename }, { status: status });
        console.log(`Estado actualizado en BD: ${filename} -> ${status}`);
    }
    res.sendStatus(200);
});

app.get('/api/status/:filename', async (req, res) => {
    try {
        const doc = await Transcription.findOne({ filename: req.params.filename });
        res.json({ status: doc ? doc.status : 'Archivo no encontrado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al consultar la BD' });
    }
});

// Endpoint para obtener todas las pistas procesadas
app.get('/api/history', async (req, res) => {
    try {
        // Busca todos los registros y los ordena del más nuevo al más viejo
        const history = await Transcription.find().sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend orquestador en puerto ${PORT}`));