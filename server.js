import express from 'express';
import cors from 'cors';
import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar variables de entorno
dotenv.config({ path: './secrets.env' });

const app = express();
const resend = new Resend(process.env.API_KEY_RESEND);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const emailFrom = 'yohualkis99@gmail.com'

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ 
        message: '🚀 Server is working!',
        timestamp: new Date().toISOString()
    });
});

// Ruta para enviar emails
app.post('/api/send-email', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;

        console.log('📧 Recibiendo datos:', { name, email, phone, message });

        const { data, error } = await resend.emails.send({
            from: emailFrom,
            to: ["Yohualkis99@gmail.com"],
            reply_to: email,
            subject: `New message of ${name} - AlexYah Transportation`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                        .info { margin: 15px 0; padding: 10px; background: #f8f9fa; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🚚 New message - AlexYah Transportation</h1>
                        </div>
                        
                        <div class="info">
                            <strong>Full name:</strong> ${name}
                        </div>
                        
                        <div class="info">
                            <strong>Email:</strong> ${email}
                        </div>
                        
                        <div class="info">
                            <strong>Phone number:</strong> ${phone}
                        </div>
                        
                        <div class="info">
                            <strong>Message:</strong><br>
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </body>
                </html>
            `
        });

        if (error) {
            console.error('❌ Error Resend:', error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to sending email. Please try again later.'
            });
        }

        console.log('✅ Email sent with ID:', data.id);
        res.json({ 
            success: true, 
            message: 'Email sent successfully!' 
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal error server...' 
        });
    }
});

// Servir archivos estáticos desde la carpeta actual
app.use(express.static(__dirname));

// También servir desde public/ si existe
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Manejar cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Apagando servidor...');
    process.exit(0);
});