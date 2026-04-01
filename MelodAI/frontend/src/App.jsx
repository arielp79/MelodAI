import { useState, useEffect } from 'react';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [filename, setFilename] = useState('');

  const stemsList = ['vocals', 'drums', 'bass', 'other'];

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) setFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('audio', file);
    setStatus('Subiendo...');

    try {
      const res = await axios.post('http://localhost:3000/api/upload', formData);
      setStatus('Archivo en proceso');
      setFilename(res.data.filename);
    } catch (error) {
      console.error(error);
      setStatus('Error al subir el archivo');
    }
  };

  useEffect(() => {
    let interval;
    if (filename && status !== 'Completado' && !status.includes('Error')) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`http://localhost:3000/api/status/${filename}`);
          setStatus(res.data.status);
          if (res.data.status === 'Completado') {
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error al consultar estado:", error);
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [filename, status]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '50px', fontFamily: 'sans-serif' }}>
      <h1>MelodAI</h1>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{ border: '2px dashed #888', borderRadius: '10px', padding: '50px', textAlign: 'center', cursor: 'pointer', width: '300px', backgroundColor: '#f9f9f9' }}
      >
        <UploadCloud size={50} color="#555" />
        <p style={{ color: '#333' }}>{file ? file.name : 'Arrastra tu archivo de audio aquí'}</p>
      </div>

      <button onClick={handleUpload} disabled={!file} style={{ marginTop: '20px', padding: '10px 20px', cursor: file ? 'pointer' : 'not-allowed' }}>
        Subir y Procesar
      </button>

      <p style={{ marginTop: '20px', fontWeight: 'bold' }}>Estado: {status}</p>

      {status === 'Completado' && (
        <div style={{ marginTop: '30px', width: '100%', maxWidth: '600px' }}>
          <h3>Pistas Separadas:</h3>
          {stemsList.map((stem) => (
            <div key={stem} style={{ marginBottom: '15px' }}>
              <p style={{ margin: '0 0 5px 0', textTransform: 'capitalize' }}>{stem}</p>
              <audio controls style={{ width: '100%' }}>
                <source src={`http://localhost:3000/stems/${filename}/${stem}.wav`} type="audio/wav" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;