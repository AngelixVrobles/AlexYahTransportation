import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import multer from 'multer';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '🚀 Server is working!',
        timestamp: new Date().toISOString(),
        emailConfig: true
    });
});

// Ruta de salud para Render
app.get('/health', (req, res) => {
    res.send('🩺 OK');
});

// Ruta para enviar emails
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Name, email and message are required fields.'
            });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 465,
            secure: true,
            auth: {
                user: 'josegabrielestrella05@gmail.com',
                pass: 'zlwdjmnqbswgnvsz' // sin espacios
            }
        });

        const mailOptions = {
            from: {
                name: "AlexYah Transportation",
                address: 'josegabrielestrella05@gmail.com'
            },
            to: 'josegabrielestrella04@gmail.com',
            replyTo: {
                name: name,
                address: email
            },
            subject: `📧 New Message from ${name} - AlexYah Transportation`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial; line-height: 1.6; background-color: #f4f4f4; padding: 20px; }
                        .container { max-width: 600px; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); margin: auto; }
                        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px; }
                        .info { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #007bff; }
                        .info strong { color: #007bff; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header"><h1>🚚 New Message - AlexYah Transportation</h1></div>
                        <div class="info"><strong>👤 Name:</strong> ${name}</div>
                        <div class="info"><strong>📧 Email:</strong> ${email}</div>
                        <div class="info"><strong>📱 Phone:</strong> ${phone}</div>
                        <div class="info"><strong>📩 Message:</strong><br>${message.replace(/\n/g, '<br>')}</div>
                        <div class="info" style="background: #e7f3ff;"><strong>📬 Sent from contact form</strong></div>
                    </div>
                </body>
                </html>
            `,
            text: `New message from ${name} (${email}). Phone: ${phone}. Message: ${message}`
        };

        const info = await transporter.sendMail(mailOptions);

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
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

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

const camposArchivos = Object.keys(nombresBonitos).map(k => ({
  name: k,
  maxCount: k === 'car_pictures' ? 5 : 1
}));

app.post("/upload", upload.fields(camposArchivos), async (req, res) => {
  try {
    const attachments = [];
    let listaArchivos = "";

    for (let campo in req.files) {
      req.files[campo].forEach((file, index) => {
        const nombreBase = nombresBonitos[campo] || campo;
        const extension = path.extname(file.originalname);
        const filename = req.files[campo].length > 1 ? `${nombreBase} ${index + 1}` : nombreBase;

        attachments.push({
          filename: `${filename}${extension}`,
          path: file.path
        });

        listaArchivos += `✅ ${filename}${extension}\n`;
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      port: 465,
      secure: true,
      auth: {
        user: 'josegabrielestrella05@gmail.com',
        pass: 'zlwdjmnqbswgnvsz'
      }
    });

    const mailOptions = {
      from: {
        name: "AlexYah Transportation",
        address: 'josegabrielestrella05@gmail.com'
      },
      to: 'josegabrielestrella04@gmail.com',
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

    const info = await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Driver form was sent successfully ✅" });

  } catch (err) {
    console.error("❌ ERROR DETALLADO:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to sending form ❌",
      error: err.message 
    });
  }
});

// Ruta raíz
app.get("/", (req, res) => {
  res.send("🚀 Server running in Render!");
});

app.use(express.static('./'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
