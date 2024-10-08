const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 10000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

let participantsData = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/submit', (req, res) => {
    const duracionMinima = parseFloat(req.body.duracion);
    const nombre = req.body.nombre;
    const disponibilidad = req.body.disponibilidad;

    participantsData = [];

    for (let i = 0; i < nombre.length; i++) {
        const participant = {
            nombre: nombre[i],
            disponibilidad: disponibilidad[i].split(',').map(range => range.trim())
        };
        participantsData.push(participant);
    }

    const { coincidencias, noCoincidentes, comentariosNoCoincidentes } = encontrarMejoresHorarios(participantsData, duracionMinima);

    let resultadosHTML = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
        <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-KP9218VH40"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-KP9218VH40');
</script>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resultados de Coincidencias</title>
            <link rel="stylesheet" href="styles.css">
            <style>
                .container {
                    display: flex;
                    flex-direction: column;
                }
                @media (min-width: 768px) {
                    .container {
                        flex-direction: row;
                    }
                }
                .resultados, .calendly {
                    flex: 1;
                    padding: 20px;
                }
                .calendly iframe {
                    width: 100%;
                    height: 500px;
                    border: none;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                th, td {
                    padding: 10px;
                    text-align: center;
                }
                th {
                    background-color: #f2f2f2;
                }
                .centered {
                    text-align: center;
                }
                .button-container {
                    text-align: center;
                    margin-top: 20px;
                }
                .comment {
                    font-style: italic;
                    color: #555;
                    margin-top: 10px;
                }
                .pastel-button {
                    background-color: #7e57c2; /* Morado */
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }
                .pastel-button:hover {
                    background-color: #d1c4e9; /* Morado pastel */
                }
                .reservar-button {
                    background-color: #7e57c2; /* Morado fuerte */
                    color: white;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    text-align: center;
                    display: inline-block;
                }
                .reservar-button:hover {
                    background-color: #d1c4e9; /* Morado pastel */
                }
            </style>
        </head>
        <body>
            <h1 class="centered">Horarios</h1>
            <div class="container">
                <div class="resultados">
                    <h2 class="centered">Resultados</h2>`;

    if (coincidencias.length > 0) {
        resultadosHTML += `
            <table>
                <thead>
                    <tr>
                        <th>Día de ensayo</th>
                        <th>Horarios de ensayos</th>
                        <th>Participantes</th>
                    </tr>
                </thead>
                <tbody>`;

        coincidencias.forEach(horario => {
            resultadosHTML += `
                <tr>
                    <td>${horario.dia}</td>
                    <td>${horario.horario}</td>
                    <td>${horario.participantes.join(', ')}</td>
                </tr>`;
        });
        resultadosHTML += `
                </tbody>
            </table>`;

        // Agregar el botón "Reservar Estudio" si hay coincidencia total
        if (noCoincidentes.length === 0) {
          resultadosHTML += `
            <div id="coincidencia-total" class="mensaje-coincidencia">
                <strong>¡WOW, increíble todos coinciden! <br> Esto no pasa seguido, revisa la disponibilidad y reserva cuanto antes!</strong>
            </div>`;
          const horariosConcatenados = coincidencias.map(horario => `${horario.dia} de ${horario.horario}`).join(' y ');
            const mensajeWhatsapp = `Hola quiero reservar el estudio el ${horariosConcatenados}`;
            const urlWhatsapp = `https://wa.me/56996738081?text=${encodeURIComponent(mensajeWhatsapp)}`;

            resultadosHTML += `
                <div class="button-container">
                    <a href="${urlWhatsapp}" class="reservar-button">Reservar Estudio</a>
                </div>
                <div class="button-container">
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSfyrECueLBj66fF3J9QJ0RfjNBHjDVfQ_cV4_bx4a4D47aChw/viewform?usp=sf_link" class="survey-button" target="_blank">Participa en nuestra encuesta</a>
            </div>`;
        }
    } else {
        resultadosHTML += `<p>No hay coincidencias disponibles.</p>`;
    }

    if (noCoincidentes.length > 0) {
        resultadosHTML += `
            <h2 class="centered">No Coincidentes</h2>
            <ul>`;

        noCoincidentes.forEach(participant => {
            resultadosHTML += `<li>${participant.nombre} (${participant.horario.join(', ')})</li>`;
        });

        comentariosNoCoincidentes.forEach(comentario => {
            resultadosHTML += `<p class="comment">${comentario}</p>`;
        });

        resultadosHTML += `
            </ul>
            <div class="button-container">
                <button class="pastel-button" onclick="window.location.href='/'">Volver</button>
            </div>
            <div class="button-container">
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSfyrECueLBj66fF3J9QJ0RfjNBHjDVfQ_cV4_bx4a4D47aChw/viewform?usp=sf_link" class="survey-button" target="_blank">Participa en nuestra encuesta</a>
            </div>`;
    }

    resultadosHTML += `
                </div>
                <div class="calendly">
                    <h2 class="centered">Revisar disponibilidad de estudio</h2>
                    <iframe src="https://calendly.com/mwcvodcast/ensayos"></iframe>
                </div>
            </div>
        </body>
        </html>`;

    res.send(resultadosHTML);
});

function encontrarMejoresHorarios(participantsData, duracionMinima) {
    let coincidenciasPorDia = {};
    let noCoincidentes = new Set(participantsData.map(p => p.nombre));
    let comentariosNoCoincidentes = [];

    // Organizar disponibilidades por día
    participantsData.forEach(participant => {
        participant.disponibilidad.forEach(disponibilidad => {
            let [dia, horas] = disponibilidad.split(' ');
            let [inicio, fin] = horas.split('-').map(hora => parseHora(hora.trim()));

            if (!coincidenciasPorDia[dia]) {
                coincidenciasPorDia[dia] = [];
            }
            coincidenciasPorDia[dia].push({ nombre: participant.nombre, inicio, fin, horario: horas });
        });
    });

    let coincidencias = [];

    // Evaluar coincidencias por día
    for (let dia in coincidenciasPorDia) {
        let rangos = coincidenciasPorDia[dia];

        // Encontrar el intervalo máximo de coincidencia por día
        let maxInicio = Math.max(...rangos.map(r => r.inicio));
        let minFin = Math.min(...rangos.map(r => r.fin));

        if (minFin - maxInicio >= duracionMinima) {
            let participantesCoincidentes = rangos
                .filter(rango => rango.inicio <= maxInicio && rango.fin >= minFin)
                .map(rango => rango.nombre);

            // Verificar si la coincidencia ya existe
            let yaExiste = coincidencias.some(coincidencia =>
                coincidencia.dia === dia &&
                coincidencia.horario === `${formatHora(maxInicio)} - ${formatHora(minFin)}` &&
                coincidencia.participantes.sort().join(',') === participantesCoincidentes.sort().join(',')
            );

            if (!yaExiste && participantesCoincidentes.length > 1) {
                coincidencias.push({
                    dia: dia,
                    horario: `${formatHora(maxInicio)} - ${formatHora(minFin)}`,
                    participantes: participantesCoincidentes
                });

                // Quitar a los participantes coincidentes de la lista de no coincidentes
                participantesCoincidentes.forEach(nombre => noCoincidentes.delete(nombre));
            }
        }
    }

    // Generar comentarios para no coincidentes
    let participantesNoCoincidentes = Array.from(noCoincidentes).map(nombre => {
        let participante = participantsData.find(p => p.nombre === nombre);
        return { nombre, horario: participante.disponibilidad };
    });
    let mensajeNoCoincidentes;

    if (participantesNoCoincidentes.length > 0) {
        if (participantesNoCoincidentes.length > 1) {
            mensajeNoCoincidentes = `Consulta si ${participantesNoCoincidentes.slice(0, -1).map(p => `${p.nombre}`).join(', ')} y ${participantesNoCoincidentes.slice(-1).map(p => `${p.nombre}`)} pueden hacer una excepción y acomodarse al horario... en pedir no hay engaño.`;
        } else {
            mensajeNoCoincidentes = `Consulta si ${participantesNoCoincidentes[0].nombre} puede hacer una excepción y acomodarse al horario... en pedir no hay engaño.`;
        }

        comentariosNoCoincidentes.push(mensajeNoCoincidentes);
    }

    return { coincidencias, noCoincidentes: participantesNoCoincidentes, comentariosNoCoincidentes };
}

function parseHora(hora) {
    let [horas, minutos] = hora.split(':').map(Number);
    return horas + minutos / 60;
}

function formatHora(hora) {
    let horas = Math.floor(hora);
    let minutos = Math.round((hora - horas) * 60);
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
