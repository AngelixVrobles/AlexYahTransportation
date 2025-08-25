import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import multer from 'multer';

dotenv.config({ path: 'secrets.env' });

console.log('🔍 Loading envoirements variables from: secrets.env');
console.log('📧 Email config:', process.env.EMAIL_USER ? 'PRESENT' : 'AUSENT');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === SERVIR ARCHIVOS ESTÁTICOS DESDE /PUBLIC ===
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '🚀 Server is working!',
        timestamp: new Date().toISOString(),
        emailConfig: !!process.env.EMAIL_USER
    });
});

// Ruta para enviar emails CON NODEMAILER
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        
        console.log('📨 Request received from:', email);
        
        // Validar campos requeridos
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email and message are required fields.'
            });
        }

        // Configurar transporter de Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail', // Puedes usar 'hotmail', 'yahoo', etc.
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // Tu email completo
                pass: process.env.EMAIL_PASSWORD // Tu contraseña de aplicación
            }
        });

        // Configurar el email
        const mailOptions = {
            from: {
                name: "AlexYah Transportation",
                address: process.env.EMAIL_USER
            },
            to: process.env.EMAIL_USER,
            replyTo: {
                name: name,
                address: email
            }, // Email del cliente para responder
            subject: `📧 New Message from ${name} - AlexYah Transportation`,
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
                            <h1>🚚 New Message - AlexYah Transportation</h1>
                        </div>
                        
                        <div class="info">
                            <strong>👤 Name:</strong> ${name}
                        </div>
                        
                        <div class="info">
                            <strong>📧 Email:</strong> ${email}
                        </div>
                        
                        <div class="info">
                            <strong>📱 Phone:</strong> ${phone}
                        </div>
                        
                        <div class="info">
                            <strong>📩 Message:</strong><br>
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                        
                        <div class="info" style="background: #e7f3ff;">
                            <strong>📬 This message was sent from the contact us form of AlexYah Transportation</strong>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `New message from ${name} (${email}). Phone: ${phone}. Message: ${message}`
        };

        console.log('📤 Sending email...');
        
        // Enviar email
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email sent witg ID:', info.messageId);
        
        res.json({ 
            success: true, 
            message: 'Email sent successfully!',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('❌ Error Nodemailer:', error);
        
        res.status(500).json({ 
            success: false, 
            error: 'Error sending email. Please try again later.',
            details: error.message
        });
    }
});

// === Multer config ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // carpeta donde se guardan
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// === Diccionario de nombres bonitos ===
const nombresBonitos = {
  driver_license: "Driver License",
  profile_picture: "Profile Picture",
  registration: "Registration",
  insurance: "Insurance",
  inspection: "Inspection",
  car_pictures: "Car Picture",
  live_scan: "Live Scan",
  tb_test: "TB Test",
  drug_test: "Drug Test",
  cpr: "CPR",
  dot: "DOT",
  english_course: "English Course",
  pull_notice: "Pull Notice",
  safe_ride: "Safe Ride",
  w9: "W9"
};

// === Campos esperados ===
const camposArchivos = [
  { name: "driver_license", maxCount: 1 },
  { name: "profile_picture", maxCount: 1 },
  { name: "registration", maxCount: 1 },
  { name: "insurance", maxCount: 1 },
  { name: "inspection", maxCount: 1 },
  { name: "car_pictures", maxCount: 5 },
  { name: "live_scan", maxCount: 1 },
  { name: "tb_test", maxCount: 1 },
  { name: "drug_test", maxCount: 1 },
  { name: "cpr", maxCount: 1 },
  { name: "dot", maxCount: 1 },
  { name: "english_course", maxCount: 1 },
  { name: "pull_notice", maxCount: 1 },
  { name: "safe_ride", maxCount: 1 },
  { name: "w9", maxCount: 1 }
];

// === Ruta para recibir formulario ===
app.post("/upload", upload.fields(camposArchivos), async (req, res) => {
  try {
    console.log("📦 REQ.BODY:", JSON.stringify(req.body, null, 2));
    console.log("📁 REQ.FILES:", JSON.stringify(req.files, null, 2));

    // 📎 Construir adjuntos con nombres bonitos
    const attachments = [];
    let listaArchivos = "";

    console.log("🔄 Procesando archivos...");
    
    for (let campo in req.files) {
      console.log(`📂 Campo: ${campo}`);
      
      req.files[campo].forEach((file, index) => {
        console.log(`📄 Archivo ${index + 1}:`, file);

        let nombreBase = nombresBonitos[campo] || campo;
        let extension = path.extname(file.originalname);
        let filename = nombreBase;

        // Enumerar si hay múltiples archivos
        if (req.files[campo].length > 1) {
          filename += ` ${index + 1}`;
        }

        console.log(`🏷️ Nombre final: ${filename}${extension}`);
        console.log(`📁 Ruta: ${file.path}`);
        console.log(`📏 Tamaño: ${file.size} bytes`);

        attachments.push({
          filename: `${filename}${extension}`,
          path: file.path
        });

        // Agregar al cuerpo del correo como checklist
        listaArchivos += `✅ ${filename}${extension}\n`;
      });
    }

    console.log("📎 Adjuntos preparados:", attachments);
    console.log("📝 Lista de archivos:\n", listaArchivos);

    // === Enviar correo ===
    console.log("📤 Preparando envío de correo...");
    
    const transporter = nodemailer.createTransport({
            service: 'gmail', // Puedes usar 'hotmail', 'yahoo', etc.
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER, // Tu email completo
                pass: process.env.EMAIL_PASSWORD // Tu contraseña de aplicación
            }
        });

    const mailOptionsDriverRegistration = {
      from: {
        name: "AlexYah Transportation",
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_USER,
      replyTo: {
        name: req.body.name,
        address: req.body.email
      },
      subject: "New Register Request 🚗",
      text: `📋 User Data:
- Name: ${req.body.name}
- Last Name: ${req.body.last_name}
- Email: ${req.body.email}
- Phone Number: ${req.body.phone}
- State: ${req.body.state}
- City: ${req.body.city}

📎 Received Files:
${listaArchivos}`,
      attachments
    };

    console.log("✉️ Opciones de correo:", mailOptionsDriverRegistration);

    // Verificar que el transporter esté configurado
    console.log("🔧 Transporter configurado:", !!transporter);

    // Enviar correo
    console.log("🚀 Enviando correo...");
    const info = await transporter.sendMail(mailOptionsDriverRegistration);
    
    console.log("✅ Correo enviado con ID:", info.messageId);
    console.log("📧 Respuesta:", info);

    // Respuesta al cliente
    res.json({ success: true, message: "Driver form was sent successfully ✅" });

  } catch (err) {
    console.error("❌ ERROR DETALLADO:");
    console.error("📍 Mensaje:", err.message);
    console.error("📍 Stack:", err.stack);
    console.error("📍 Código:", err.code);
    
    if (err.response) {
      console.error("📍 Respuesta SMTP:", err.response);
    }
    
    res.status(500).json({ 
      success: false, 
      message: "Failed to sending form ❌",
      error: err.message 
    });
  }
});

// === RUTA RAIZ PARA SERVIR INDEX.HTML DESDE /PUBLIC ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// === Ruta raíz para Render ===
app.get("/public", (req, res) => {
  res.send("🚀 Server running in Render!");
});
      
// === Servidor ===
app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`);
});