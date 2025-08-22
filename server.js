const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const path = require("path");


const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
    console.log(req.body);
    console.log(req.files);

    // 📎 Construir adjuntos con nombres bonitos
    const attachments = [];
    let listaArchivos = "";

    for (let campo in req.files) {
      req.files[campo].forEach((file, index) => {
        let nombreBase = nombresBonitos[campo] || campo;
        let extension = path.extname(file.originalname);
        let filename = nombreBase;

        // Enumerar si hay múltiples archivos
        if (req.files[campo].length > 1) {
          filename += ` ${index + 1}`;
        }

        attachments.push({
          filename: `${filename}${extension}`,
          path: file.path
        });

        // Agregar al cuerpo del correo como checklist
        listaArchivos += `✅ ${filename}${extension}\n`;
      });
    }

    // === Configurar transporte de correo ===
    const transporter = nodemailer.createTransport({
      service: "gmail", // puedes cambiar por Outlook, SMTP, etc
      auth: {
        user: "josegabrielestrella05@gmail.com",
        pass: "zlwd jmnq bswg nvsz"
      }
    });

    // === Enviar correo ===
    const mailOptions = {
      from: "josegabrielestrella05@gmail.com",
      to: "josegabrielestrella04@gmail.com",
      subject: "Nueva Solicitud de Registro 🚗",
      text: `
📋 Datos del Usuario:
- Email: ${req.body.email}
- Address: ${req.body.address}
- Emergency Contact: ${req.body.emergency_contact}

📎 Archivos Recibidos:
${listaArchivos}
      `,
      attachments
    };

    await transporter.sendMail(mailOptions);

    res.send("Formulario y archivos enviados correctamente ✅");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al enviar el formulario ❌");
  }
});

app.use(express.static("public"));


// === Servidor ===
app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
