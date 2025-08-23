import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

dotenv.config({ path: 'secrets.env' });

console.log('🔍 Loading envoirements variables from: secrets.env');
console.log('📧 Email config:', process.env.EMAIL_USER ? 'PRESENT' : 'AUSENT');

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

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
            from: `"${name}" <${email}>`, // Email que envía
            to: process.env.EMAIL_USER, // Email que recibe
            replyTo: email, // Email del cliente para responder
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

// Servir archivos estáticos
app.use(express.static('./'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📧 Email config: ${process.env.EMAIL_USER ? 'ACTIVE' : 'INACTIVE'}`);
});