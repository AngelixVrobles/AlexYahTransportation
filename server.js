import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import multer from 'multer';

dotenv.config({ path: 'secrets.env' });

console.log('Loading environment variables from: secrets.env');
console.log('Email config:', process.env.EMAIL_USER ? 'PRESENT' : 'ABSENT');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === SERVIR ARCHIVOS ESTÁTICOS DESDE /PUBLIC ===
app.use(express.static(path.join(__dirname, 'public')));

// === Nodemailer transporter (reutilizable) ===
function createTransporter() {
    return nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

// === Escapar HTML para prevenir XSS en emails ===
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Server is working!',
        timestamp: new Date().toISOString(),
        emailConfig: !!process.env.EMAIL_USER
    });
});

// Ruta para enviar emails CON NODEMAILER
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        console.log('Request received from:', email);

        // Validar campos requeridos
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email and message are required fields.'
            });
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid email format.'
            });
        }

        const safeName    = escapeHtml(name);
        const safeEmail   = escapeHtml(email);
        const safePhone   = escapeHtml(phone || '');
        const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

        const transporter = createTransporter();

        const mailOptions = {
            from: {
                name: "AlexYah Transportation",
                address: process.env.EMAIL_USER
            },
            to: 'Alexyahiring@gmail.com',
            replyTo: {
                name: safeName,
                address: email
            },
            subject: `New Message from ${safeName} - AlexYah Transportation`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: white;
                            padding: 20px;
                            border-radius: 10px;
                            box-shadow: 0 0 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: #007bff;
                            color: white;
                            padding: 20px;
                            text-align: center;
                            border-radius: 5px;
                        }
                        .info {
                            margin: 15px 0;
                            padding: 15px;
                            background: #f8f9fa;
                            border-radius: 5px;
                            border-left: 4px solid #007bff;
                        }
                        .info strong {
                            color: #007bff;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>New Message - AlexYah Transportation</h1>
                        </div>

                        <div class="info">
                            <strong>Name:</strong> ${safeName}
                        </div>

                        <div class="info">
                            <strong>Email:</strong> ${safeEmail}
                        </div>

                        <div class="info">
                            <strong>Phone:</strong> ${safePhone}
                        </div>

                        <div class="info">
                            <strong>Message:</strong><br>
                            ${safeMessage}
                        </div>

                        <div class="info" style="background: #e7f3ff;">
                            <strong>This message was sent from the contact form of AlexYah Transportation</strong>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `New message from ${name} (${email}). Phone: ${phone}. Message: ${message}`
        };

        console.log('Sending email...');

        const info = await transporter.sendMail(mailOptions);

        console.log('Email sent with ID:', info.messageId);

        res.json({
            success: true,
            message: 'Email sent successfully!',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending email:', error.message);

        res.status(500).json({
            success: false,
            error: 'Error sending email. Please try again later.'
        });
    }
});

// === Multer config ===
const ALLOWED_MIMETYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf'
];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por archivo
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes y PDFs.`));
        }
    }
});

// === Diccionario de nombres para adjuntos ===
const nombresBonitos = {
    driver_license:   "Driver License",
    profile_picture:  "Profile Picture",
    registration:     "Registration",
    insurance:        "Insurance",
    inspection:       "Inspection",
    car_pictures:     "Car Picture",
    live_scan:        "Live Scan",
    tb_test:          "TB Test",
    drug_test:        "Drug Test",
    cpr:              "CPR",
    dot:              "DOT",
    english_course:   "English Course",
    pull_notice:      "Pull Notice",
    safe_ride:        "Safe Ride",
    w9:               "W9"
};

// === Campos esperados ===
const camposArchivos = [
    { name: "driver_license",   maxCount: 1 },
    { name: "profile_picture",  maxCount: 1 },
    { name: "registration",     maxCount: 1 },
    { name: "insurance",        maxCount: 1 },
    { name: "inspection",       maxCount: 1 },
    { name: "car_pictures",     maxCount: 5 },
    { name: "live_scan",        maxCount: 1 },
    { name: "tb_test",          maxCount: 1 },
    { name: "drug_test",        maxCount: 1 },
    { name: "cpr",              maxCount: 1 },
    { name: "dot",              maxCount: 1 },
    { name: "english_course",   maxCount: 1 },
    { name: "pull_notice",      maxCount: 1 },
    { name: "safe_ride",        maxCount: 1 },
    { name: "w9",               maxCount: 1 }
];

// === Ruta para recibir formulario de conductor ===
app.post('/upload', upload.fields(camposArchivos), async (req, res) => {
    try {
        const attachments = [];
        let listaArchivos = '';

        for (let campo in req.files) {
            req.files[campo].forEach((file, index) => {
                let nombreBase = nombresBonitos[campo] || campo;
                let extension  = path.extname(file.originalname);
                let filename   = nombreBase;

                if (req.files[campo].length > 1) {
                    filename += ` ${index + 1}`;
                }

                attachments.push({
                    filename: `${filename}${extension}`,
                    path: file.path
                });

                listaArchivos += `- ${filename}${extension}\n`;
            });
        }

        const transporter = createTransporter();

        const mailOptionsDriverRegistration = {
            from: {
                name: "AlexYah Transportation",
                address: process.env.EMAIL_USER
            },
            to: 'Alexyahiring@gmail.com',
            replyTo: {
                name: req.body.name,
                address: req.body.email
            },
            subject: "New Driver Application - AlexYah Transportation",
            text: `Driver Application:
- Name: ${req.body.name}
- Last Name: ${req.body.last_name}
- Email: ${req.body.email}
- Phone Number: ${req.body.phone}
- State: ${req.body.state}
- City: ${req.body.city}

Received Files:
${listaArchivos}`,
            attachments
        };

        const info = await transporter.sendMail(mailOptionsDriverRegistration);
        console.log('Driver application email sent with ID:', info.messageId);

        res.json({ success: true, message: 'Driver form was sent successfully.' });

    } catch (err) {
        console.error('Error sending driver application:', err.message);

        res.status(500).json({
            success: false,
            message: 'Failed to send form. Please try again.',
            error: err.message
        });
    }
});

// === RUTA RAIZ PARA SERVIR INDEX.HTML DESDE /PUBLIC ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Ruta raíz para Render ===
app.get('/public', (req, res) => {
    res.send('Server is running!');
});

// === Servidor ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
