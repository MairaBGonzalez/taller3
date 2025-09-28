# Encuéntrame 🐾

> Una aplicación móvil para ayudar a encontrar mascotas perdidas o reportar animales encontrados.

Desarrollado como trabajo anual por Maira González y Diego Ledesma
Instituto: IFTS16
Materia: Taller 3
Año: 2025

---

## 🎯 Objetivo General

Desarrollar una aplicación móvil que centralice los esfuerzos de búsqueda de mascotas perdidas, facilitando la comunicación entre dueños y la comunidad.

---

## 🧩 Problema que resuelve

La pérdida de mascotas es una situación angustiante. Hoy, los dueños deben recurrir a redes sociales dispersas, grupos informales o carteles, lo que dificulta una difusión rápida y organizada.

**Encuéntrame** surge como solución a esta problemática: una plataforma única donde:
- Los usuarios pueden registrar mascotas perdidas o encontradas
- Subir fotos, descripciones y ubicación
- Recibir notificaciones y avistamientos

---

## 🔍 Alcance del Sistema

### Funcionalidades incluidas
- ✅ Registro e inicio de sesión de usuarios
- ✅ Publicación de mascotas con foto, tipo, raza, color, edad y estado (perdida/encontrada)
- ✅ Filtrado por ubicación
- ✅ Búsqueda avanzada con filtros (tipo, estado, raza, etc.)
- ✅ Perfil de usuario con historial de publicaciones
- ✅ Base de datos en la nube (MariaDB)
- ✅ Backend seguro con autenticación JWT
- ✅ Frontend responsive y accesible

### Exclusiones
- ❌ No incluye adopciones ni venta de mascotas
- ❌ No reemplaza servicios oficiales de denuncia

---

## 👥 Actores Clave

| Actor | Función |
|------|--------|
| **Dueño de mascota** | Registra mascotas perdidas y busca ayuda |
| **Comunidad de usuarios** | Reporta avistamientos y difunde información |

---

## 🛠️ Tecnologías utilizadas

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js + Express
- **Base de datos**: MariaDB (en servidor del profesor)
- **Autenticación**: JWT (JSON Web Tokens)
- **Almacenamiento de imágenes**: Base64 en base de datos
- **Herramientas**: MySQL Workbench, VS Code, Git, GitHub

---

## ▶️ Cómo ejecutar el proyecto

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/MairaBGonzalez/taller3.git
